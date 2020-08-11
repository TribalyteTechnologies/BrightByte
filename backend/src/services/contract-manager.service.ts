import { Injectable, HttpService } from "@nestjs/common";
import { BackendConfig } from "../backend.config";
import { ILogger, LoggerService } from "../logger/logger.service";
import { Web3Service } from "../services/web3.service";
import Web3 from "web3";
import { Observable, from } from "rxjs";
import { flatMap, map, tap, shareReplay } from "rxjs/operators";
import { ITrbSmartContact, ITrbSmartContractJson } from "../models/smart-contracts.model";

enum ContractsIndex {
    BbFactory = 0,
    EventDispatcher = 1
}

@Injectable()
export class ContractManagerService {

    private readonly TRANSACTION_HASH_PROPERTY = "transactionHash";
    private readonly BLOCK_NUMBER_PROPERTY = "blockNumber";
    private readonly RANDOM_ADDRESS = "0xF19853c2C92684B2F6C3E48d614Ad114853D52Cb";

    private contractAddressEventDispatcher: string;
    private contractAddressBbFactory: string;
    private log: ILogger;
    private web3: Web3;
    private contracts: Array<ITrbSmartContact>;
    private eventDispatcherContractAbi: ITrbSmartContractJson;
    private bbFactoryContractAbi: ITrbSmartContractJson;
    private initObs: Observable<string>;


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

    public getEventDispatcherSmartContract(): Observable<ITrbSmartContact> {
        return this.initObs.pipe(map(() => this.contracts[ContractsIndex.EventDispatcher]));
    }

    public getEventDispatcherAbi(): Observable<ITrbSmartContractJson> {
        return this.initObs.pipe(map(() => this.eventDispatcherContractAbi));
    }

    public getEventDispatcherContractAddress(): Observable<string> {
        return this.initObs.pipe(map(() => this.contractAddressEventDispatcher));
    }

    public getCurrentBlock(): Observable<number> {
        return this.initObs.pipe(
            flatMap(() => {
                return this.web3.eth.getTransaction(this.eventDispatcherContractAbi.networks[BackendConfig.NET_ID]
                    [this.TRANSACTION_HASH_PROPERTY]);
            }),
            map(txInfo => {
                return txInfo[this.BLOCK_NUMBER_PROPERTY];
            }));
    }

    private getEventDispatcherAddress(): Observable<string> {
        return from<string>(this.contracts[ContractsIndex.BbFactory].methods.getEventDispatcherAddress()
        .call({ from: this.RANDOM_ADDRESS }));
    }

    private init() {
        this.log.d("Initializing Contract Manager Service");
        this.initObs = this.web3Service.openConnection().pipe(
            flatMap((web3: Web3) => {
                this.web3 = web3;
                return this.httpSrv.get(BackendConfig.CLOUD_BB_FACTORY_CONTRACT_URL);
            }),
            flatMap(response => {
                this.bbFactoryContractAbi = response.data;
                this.contractAddressBbFactory = this.bbFactoryContractAbi.networks[BackendConfig.NET_ID].address;
                this.contracts.push(new this.web3.eth.Contract(this.bbFactoryContractAbi.abi, this.contractAddressBbFactory));
                return this.httpSrv.get(BackendConfig.CLOUD_EVENT_DISPATCHER_CONTRACT_URL);
            }),
            flatMap(response => {
                this.eventDispatcherContractAbi = response.data;
                return this.getEventDispatcherAddress();
            }),
            tap(address => {
                this.contractAddressEventDispatcher = address;
                this.contracts.push(new this.web3.eth.Contract(this.eventDispatcherContractAbi.abi, this.contractAddressEventDispatcher));
            }),
            shareReplay(BackendConfig.BUFFER_SIZE));
    }
}
