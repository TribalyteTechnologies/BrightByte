import { Injectable } from "@nestjs/common";
import { BackendConfig } from "../backend.config";
import { ILogger, LoggerService } from "../logger/logger.service";
import { Web3Service } from "../services/web3.service";
import BrightContractAbi from "../assets/build/Bright.json";
import Web3 from "web3";
import { UserDetailsDto } from "../dto/user-details.dto";
import { Observable, from, forkJoin } from "rxjs";
import { flatMap, map } from "rxjs/operators";

interface ITrbSmartContractJson {
    abi: Array<any>;
}

interface ITrbSmartContact {
    [key: string]: any;
}

@Injectable()
export class ContractManagerService {

    private contractAddressBright: string;
    private log: ILogger;
    private web3: Web3;
    private jsonBrightContractData: ITrbSmartContractJson;
    private contracts: Array<ITrbSmartContact>;

    public constructor(
        private web3Service: Web3Service,
        private loggerSrv: LoggerService
    ) {
        this.log = loggerSrv.get("ContractManagerService");
        this.web3 = web3Service.getWeb3();
        this.web3Service = web3Service;
        this.jsonBrightContractData = BrightContractAbi;
        this.contracts = new Array<ITrbSmartContact>();
        this.init();
    }

    public getAllUserData(): Observable<Array<UserDetailsDto>> {
        return this.getUsersAddress().pipe(flatMap((usersAddress: String[]) => {
            this.log.d("The number of users is " + usersAddress.length);
            let observables = usersAddress.map(userAddress => from(
                this.contracts[0].methods.getUserGlobalReputation(userAddress).call()
            ).pipe(
                map((userData: any[])  => UserDetailsDto.fromSmartContract(userData))
            ));
            return forkJoin(observables);
        }));
    }

    private init() {
        this.log.d("Initializing Contract Manager Service");
        this.contractAddressBright = BrightContractAbi.networks[BackendConfig.netId].address;
        this.contracts.push(new this.web3.eth.Contract(this.jsonBrightContractData.abi, this.contractAddressBright));
    }

    private getUserNumber(): Observable<Number> {
        return from<Number>(this.contracts[0].methods.getNumbers().call());
    }

    private getUsersAddress(): Observable<String[]> {
        return from<String[]>(this.contracts[0].methods.getUsersAddress().call());
    }
}