import { Injectable, HttpService } from "@nestjs/common";
import { BackendConfig } from "../backend.config";
import { ILogger, LoggerService } from "../logger/logger.service";
import { Web3Service } from "../services/web3.service";
import Web3 from "web3";
import { UserDetailsDto } from "../dto/user-details.dto";
import { Observable, from, forkJoin, concat } from "rxjs";
import { flatMap, map, tap, shareReplay, catchError, toArray } from "rxjs/operators";
import { AxiosResponse } from "axios";
import { ITrbSmartContact, ITrbSmartContractJson } from "../models/smart-contracts.model";
import { ReviewEventDto } from "../dto/events/review-event.dto";
import { CommentDetailsDto } from "../dto/comment-details.dto";


@Injectable()
export class ContractManagerService {

    private contractAddressBright: string;
    private contractAddressCommits: string;
    private log: ILogger;
    private web3: Web3;
    private contracts: Array<ITrbSmartContact>;
    private brightContractAbi: ITrbSmartContractJson;
    private commitsContractAbi: ITrbSmartContractJson;
    private initObs: Observable<AxiosResponse<any>>;


    public constructor(
        private httpSrv: HttpService,
        private web3Service: Web3Service,
        private loggerSrv: LoggerService
    ) {
        this.log = loggerSrv.get("ContractManagerService");
        this.web3 = this.web3Service.openConnection();
        this.contracts = new Array<ITrbSmartContact>();
        this.init();
    }

    public getAllUserData(): Observable<Array<UserDetailsDto>> {
        let allAddresses;
        return this.initObs.pipe(
            flatMap(() => this.getUsersAddress()),
            flatMap((usersAddresses: Array<String>) => {
                allAddresses = usersAddresses;
                let observables = usersAddresses.map(userAddress => from(
                    this.contracts[0].methods.getUser(userAddress).call()
                ).pipe(
                    map((userData: any[]) => UserDetailsDto.fromSmartContract(userData))
                ));
                return forkJoin(observables);
            }),
            map((userData: Array<UserDetailsDto>) => {
                return userData;
            })
        );
    }

    public getReviewTimedEvents(allUserData: Array<UserDetailsDto>): Observable<Array<ReviewEventDto>> {
        let lastSeasonIndex;
        return this.getCurrentSeason().pipe(
            flatMap((seasonData: Array<number>) => {
                lastSeasonIndex = seasonData[0];
                let observables = allUserData.map(address => {
                    let seasonStateObs = new Array<Observable<Array<number>>>();
                    for (let i = 0; i <= lastSeasonIndex; i++) {
                        seasonStateObs.push(this.getUsersSeasonState(address.userHash, i));
                    }
                    return forkJoin(seasonStateObs);
                });
                return forkJoin(observables);
            }),
            flatMap((userState: Array<Array<Array<number>>>) => {
                let observables = userState.map((user, i) => {
                    let userObs = user.map((season, j) => {
                        return this.getUserSeasonCommits(allUserData[i].userHash, j, 0, season[1])
                            .pipe(
                                map((state: Array<string>) => {
                                    this.log.d("Getting commits from user " + i + " in season " + j);
                                    return state[1];
                                }),
                                catchError((error) => {
                                    this.log.e("ERROR: " + error.message);
                                    return null;
                                })
                            );
                    });
                    return forkJoin(userObs);
                });
                return forkJoin(observables);
            }),
            flatMap((commitHashes: Array<Array<Array<string>>>) => {
                return this.getCommentsDetailsObs(commitHashes, allUserData);
            }),
            map((comments: Array<Array<Array<CommentDetailsDto>>> | Array<Array<Array<Array<CommentDetailsDto>>>>) => {
                let eventsDtos = new Array<ReviewEventDto>();

                comments.forEach((user, i) => {
                    user.forEach(season => {
                        season.forEach(commit => {
                            let comment = CommentDetailsDto.fromSmartContract(commit);
                            eventsDtos.push(new ReviewEventDto(allUserData[i].userHash, 0, comment.creationDate));
                        });
                    });
                });

                return eventsDtos;
            }),
            catchError((error) => {
                this.log.e("ERROR: " + error.message);
                return null;
            })
        );
    }

    public getBrightSmartContract(): Observable<ITrbSmartContractJson> {
        return this.initObs.pipe(map(() => this.brightContractAbi));
    }

    private getUserNumber(): Observable<Number> {
        return from<Number>(this.contracts[0].methods.getNumbers().call());
    }

    private getUsersAddress(): Observable<Array<String>> {
        return from<Array<String>>(this.contracts[0].methods.getUsersAddress().call());
    }

    private getUsersSeasonState(userHash: string, seasonIndex: number): Observable<Array<number>> {
        return from<Array<number>>(this.contracts[0].methods.getUserSeasonState(userHash, seasonIndex).call());
    }

    private getUserSeasonCommits(userHash: string, seasonIndex: number, start: number, end: number): Observable<Array<string>> {
        return from<Array<string>>(this.contracts[0].methods.getUserSeasonCommits(userHash, seasonIndex, start, end).call());
    }

    private getCommentDetail(commitHash: string, userHash: string): Observable<Array<CommentDetailsDto>> {
        return from<Array<CommentDetailsDto>>(this.contracts[1].methods.getCommentDetail(commitHash, userHash).call());
    }

    private getCurrentSeason(): Observable<Array<number>> {
        return from<Array<number>>(this.contracts[0].methods.getCurrentSeason().call());
    }

    private getCommentsDetailsObs(
        commitHashes: Array<Array<Array<string>>>, 
        allUserData: Array<UserDetailsDto>): Observable<Array<Array<Array<Array<CommentDetailsDto>>>>> {
        let obs = commitHashes.map((user, i) => {
            let seasonObs = user.map(season => {
                let commentObs = season.map(comment => {
                    return this.getCommentDetail(comment, allUserData[i].userHash).pipe(
                        tap(() => this.log.d("Getting comment " + comment + " from user " + i))
                    );
                });
                return concat(...commentObs).pipe(toArray());
            });
            return concat(...seasonObs).pipe(toArray());
        });
        return concat(...obs).pipe(toArray());
    }

    private init() {
        this.log.d("Initializing Contract Manager Service");
        this.initObs = this.httpSrv.get(BackendConfig.BRIGHT_CONTRACT_URL).pipe(
            flatMap(response => {
                this.brightContractAbi = response.data;
                this.contractAddressBright = this.brightContractAbi.networks[BackendConfig.NET_ID].address;
                this.contracts.push(new this.web3.eth.Contract(this.brightContractAbi.abi, this.contractAddressBright));
                return this.httpSrv.get(BackendConfig.COMMITS_CONTRACT_URL);
            }),
            tap(response => {
                this.commitsContractAbi = response.data;
                this.contractAddressCommits = this.commitsContractAbi.networks[BackendConfig.NET_ID].address;
                this.contracts.push(new this.web3.eth.Contract(this.commitsContractAbi.abi, this.contractAddressCommits));
            }),
            shareReplay(BackendConfig.BUFFER_SIZE));
    }
}
