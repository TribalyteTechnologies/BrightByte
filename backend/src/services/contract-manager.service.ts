import { Injectable, HttpService } from "@nestjs/common";
import { BackendConfig } from "../backend.config";
import { ILogger, LoggerService } from "../logger/logger.service";
import { Web3Service } from "../services/web3.service";
import Web3 from "web3";
import { Observable, from } from "rxjs";
import { flatMap, map, tap, shareReplay } from "rxjs/operators";
import { ITrbSmartContact, ITrbSmartContractJson } from "../models/smart-contracts.model";

enum ContractIndex {
    ProxyManager = 0,
    BbTeamManager = 1,
    EventDispatcher = 2
}

@Injectable()
export class ContractManagerService {

    private readonly TRANSACTION_HASH_PROPERTY = "transactionHash";
    private readonly BLOCK_NUMBER_PROPERTY = "blockNumber";
    private readonly RANDOM_ADDRESS = "0xF19853c2C92684B2F6C3E48d614Ad114853D52Cb";

    private contractAddressEventDispatcher: string;
    private contractAddressBbTeamManager: string;
    private contractAddressProxyManager: string;
    private log: ILogger;
    private web3: Web3;
    private contracts: Array<ITrbSmartContact>;
    private eventDispatcherContractAbi: ITrbSmartContractJson;
    private bbTeamManagerContractAbi: ITrbSmartContractJson;
    private proxyManagerContractAbi: ITrbSmartContractJson;
    private initObs: Observable<string>;


    public constructor(
        private httpSrv: HttpService,
        private web3Service: Web3Service,
        private loggerSrv: LoggerService
    ) {
        this.log = loggerSrv.get("ContractManagerService");
        this.web3 = this.web3Service.openConnection();
        this.contracts = new Array<ITrbSmartContact>();
        this.initObs = this.init();
    }

    public getEventDispatcherSmartContract(): Observable<ITrbSmartContact> {
        return this.initObs.pipe(map(() => this.contracts[ContractIndex.EventDispatcher]));
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
        return from<string>(this.contracts[ContractIndex.BbTeamManager].methods.getEventDispatcherAddress()
            .call({ from: this.RANDOM_ADDRESS }));
    }

    private getTeamManagerAddress(): Observable<string> {
        return from<string>(this.contracts[ContractIndex.ProxyManager].methods.getCurrentVersion()
            .call({ from: this.RANDOM_ADDRESS })
            .then(res => {
                return this.contracts[ContractIndex.ProxyManager].methods.getVersionContracts(res)
                    .call({ from: this.RANDOM_ADDRESS });
            })
        );
    }

    private init(): Observable<string> {
        this.log.d("Initializing Contract Manager Service");
        this.web3 = this.web3Service.openConnection();
        return from(this.web3.eth.net.isListening()).pipe(
            flatMap((res: boolean) => {
                return this.httpSrv.get(BackendConfig.PROXY_MANAGER_CONTRACT_URL);
            }),
            flatMap(response => {
                this.proxyManagerContractAbi = response.data;
                this.contractAddressProxyManager = this.proxyManagerContractAbi.networks[BackendConfig.NET_ID].address;
                this.log.d("The PROXY address is: ", this.contractAddressProxyManager);
                this.contracts.push(new this.web3.eth.Contract(this.proxyManagerContractAbi.abi, this.contractAddressProxyManager));
                return this.getTeamManagerAddress();
            }),
            flatMap((res: string) => {
                this.contractAddressBbTeamManager = res;
                this.log.d("The Team Manager address is: ", this.contractAddressBbTeamManager);
                return this.httpSrv.get(BackendConfig.CLOUD_BB_TEAM_MANAGER_CONTRACT_URL);
            }),
            flatMap(response => {
                this.bbTeamManagerContractAbi = response.data;
                this.contracts.push(new this.web3.eth.Contract(this.bbTeamManagerContractAbi.abi, this.contractAddressBbTeamManager));
                return this.httpSrv.get(BackendConfig.CLOUD_EVENT_DISPATCHER_CONTRACT_URL);
            }),
            flatMap(response => {
                this.eventDispatcherContractAbi = response.data;
                return this.getEventDispatcherAddress();
            }),
            tap(address => {
                this.contractAddressEventDispatcher = address;
                this.log.d("The EVENT address is: ", this.contractAddressEventDispatcher);
                this.contracts.push(new this.web3.eth.Contract(this.eventDispatcherContractAbi.abi, this.contractAddressEventDispatcher));
            }),
            shareReplay(BackendConfig.BUFFER_SIZE));
    }
}
