import { Injectable } from "@nestjs/common";
import { BackendConfig } from "../backend.config";
import { ILogger, LoggerService } from "../logger/logger.service";
import { Web3Service } from "../services/web3.service";
import ContractAbi from "../assets/build/Bright.json";
import Web3 from "web3";
import { DispatcherService } from "src/dispatcher/dispatcher.service";
import { CommitEventDto } from "src/dto/commitEvent.dto";


interface ITrbSmartContractJson {
    abi: Array<any>;
}

interface ITrbSmartContact {
    [key: string]: any;
}

@Injectable()
export class EventHandlerService {

    private contractAddress: string;
    private contract: ITrbSmartContact;
    private web3Service: Web3Service;
    private web3: Web3;
    private jsonContractData: ITrbSmartContractJson;
    private log: ILogger;

    public constructor(
        web3Service: Web3Service,
        loggerSrv: LoggerService,
        private dispatcher: DispatcherService
    ) {
        this.log = loggerSrv.get("EventHandlerService");
        this.web3 = web3Service.getWeb3();
        this.web3.eth.net.isListening()
            .then((res) => {
                this.init();
            }).catch(e => {
                this.log.d("Not able to open a connection " + e);
            });
        this.web3Service = web3Service;
        this.jsonContractData = ContractAbi;
    }

    public init() {
        this.log.d("Initializing Event Handler Service");
        this.contractAddress = ContractAbi.networks[BackendConfig.netId].address;
        this.contract = new this.web3.eth.Contract(this.jsonContractData.abi, this.contractAddress);
        this.registerNewListener();
    }

    public registerNewListener() {
        this.log.d("New Subscription");
        this.contract.events.UserNewCommit({ fromBlock: "latest" }, (error, event) => {
            if (event) {
                this.log.d("New event received: " + JSON.stringify(event.returnValues));
                let commitEvent =
                    new CommitEventDto(event.returnValues["userHash"], parseInt(event.returnValues["numberOfCommits"]["_hex"]));
                this.dispatcher.dispatch(commitEvent);
            } else if (error) {
                this.log.d("Connection error: " + JSON.stringify(error));
                this.web3Service.openConnection();
                this.web3 = this.web3Service.getWeb3();
                this.contract = new this.web3.eth.Contract(this.jsonContractData.abi, this.contractAddress);
                this.registerNewListener();
            }
        });
    }
}
