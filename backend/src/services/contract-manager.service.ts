import { Injectable, HttpService } from "@nestjs/common";
import { BackendConfig } from "../backend.config";
import { ILogger, LoggerService } from "../logger/logger.service";
import { Web3Service } from "../services/web3.service";
import Web3 from "web3";
import { UserDetailsDto } from "../dto/user-details.dto";
import { Observable, from, forkJoin } from "rxjs";
import { flatMap, map, tap, shareReplay } from "rxjs/operators";
import { AxiosResponse } from "axios";
import { ITrbSmartContact, ITrbSmartContractJson } from "../models/smart-contracts.model";


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
        this.web3Service = web3Service;
        this.web3 = this.web3Service.openConnection();
        this.contracts = new Array<ITrbSmartContact>();
        this.init();
    }

    public getAllUserData(): Observable<Array<UserDetailsDto>> {
        let allUserData;
        let allAddresses;
        let lastSeasonIndex;
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
            flatMap((userData: Array<UserDetailsDto>) => {
                allUserData = userData;
                return this.getCurrentSeason();
            }),
            flatMap((seasonData: Array<number>) => {
                lastSeasonIndex = seasonData[0];
                let observables = allAddresses.map(address => {
                    let seasonStateObs = new Array<Observable<Array<number>>>();
                    for (let i = 0; i <= lastSeasonIndex; i++) {
                        seasonStateObs.push(this.getUsersSeasonState(address, i));
                    }
                    return forkJoin(seasonStateObs);
                });
                return forkJoin(observables);
            }),
            flatMap((userState: Array<Array<Array<number>>>) => {
                return userState.map((user, i) => {
                    return user.map((season, j) => {
                        return this.getUserSeasonCommits(allAddresses[i], j, 0, season[1])
                        .pipe(
                            map((state: Array<string>) => {
                                return state[1];
                            })
                        );
                    });
                });
            }),
            map((commitHashes: any) => {
                return allUserData;
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
        return from<Array<any>>(this.contracts[0].methods.getUserSeasonCommits(userHash, seasonIndex, start, end).call());
    }

    private getDetailsCommits(commitHash: string): Observable<Array<any>> {
        return from<Array<any>>(this.contracts[1].methods.getDetailsCommits(commitHash).call());
    }

    private getCurrentSeason(): Observable<Array<number>> {
        return from<Array<number>>(this.contracts[0].methods.getCurrentSeason().call());
    }

    

    private init() {
        this.log.d("Initializing Contract Manager Service");
        this.initObs = this.httpSrv.get(BackendConfig.BRIGHT_CONTRACT_URL).pipe(
        tap(response => {
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
