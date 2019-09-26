import { Injectable, HttpService } from "@nestjs/common";
import { BackendConfig } from "../backend.config";
import { ILogger, LoggerService } from "../logger/logger.service";
import { Web3Service } from "../services/web3.service";
import Web3 from "web3";
import { UserDetailsDto } from "../dto/user-details.dto";
import { Observable, from, forkJoin } from "rxjs";
import { flatMap, map, tap } from "rxjs/operators";

interface ITrbSmartContact {
    [key: string]: any;
}

@Injectable()
export class ContractManagerService {

    private contractAddressBright: string;
    private log: ILogger;
    private web3: Web3;
    private contracts: Array<ITrbSmartContact>;
    private brightContractAbi;

    public constructor(
        private httpSrv: HttpService,
        private web3Service: Web3Service,
        private loggerSrv: LoggerService
    ) {
        this.log = loggerSrv.get("ContractManagerService");
        this.web3 = web3Service.getWeb3();
        this.web3Service = web3Service;
        this.contracts = new Array<ITrbSmartContact>();
        this.init();
    }

    public getAllUserData(): Observable<Array<UserDetailsDto>> {
        return this.getUsersAddress().pipe(flatMap((usersAddress: String[]) => {
            this.log.d("The number of users is " + usersAddress.length);
            let observables = usersAddress.map(userAddress => from(
                this.contracts[0].methods.getUserGlobalReputation(userAddress).call()
            ).pipe(
                map((userData: any[]) => UserDetailsDto.fromSmartContract(userData))
            ));
            return forkJoin(observables);
        }));
    }

    private getUserNumber(): Observable<Number> {
        return from<Number>(this.contracts[0].methods.getNumbers().call());
    }

    private getUsersAddress(): Observable<Array<String>> {
        return from<Array<String>>(this.contracts[0].methods.getUsersAddress().call());
    }

    private init() {
        this.log.d("Initializing Contract Manager Service");
        this.httpSrv.get(BackendConfig.BRIGHT_CONTRACT_URL).subscribe(response => {
            this.brightContractAbi = response.data;
            this.contractAddressBright = this.brightContractAbi.networks[BackendConfig.netId].address;
            this.contracts.push(new this.web3.eth.Contract(this.brightContractAbi.abi, this.contractAddressBright));
        });
    }
}
