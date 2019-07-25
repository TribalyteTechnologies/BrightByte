import { Injectable } from "@nestjs/common";
import { BackendConfig } from "../backend.config";
import { ILogger, LoggerService } from "../logger/logger.service";
import { Web3Service } from "../services/web3.service";
import ContractAbi from "../assets/build/Bright.json";
import Web3 from "web3";
import { DispatcherService } from "src/dispatcher/dispatcher.service";
import { CommitEventDto } from "src/dto/commitEvent.dto";
import { ReviewEventDto } from "src/dto/reviewEvent.dto";
import { SeasonEventDto } from "src/dto/seasonEvent.dto";


interface ITrbSmartContractJson {
    abi: Array<any>;
}

interface ITrbSmartContact {
    [key: string]: any;
}

@Injectable()
export class EventHandlerService {

    private readonly COMMIT = "Commit";
    private readonly REVIEW = "Review";
    private readonly SEASON = "Season";

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
        this.registerNewListener(this.COMMIT);
        this.registerNewListener(this.REVIEW);
    }

    public registerNewListener(type: string) {
        this.log.d("New Subscription");
        let callback = (error, event) => {
            if (event) {
                this.log.d("New event received: " + JSON.stringify(event.returnValues));
                let newEvent;
                switch (type) {
                    case this.COMMIT:
                        newEvent = new CommitEventDto(
                            event.returnValues["userHash"], parseInt(event.returnValues["numberOfCommits"]["_hex"]));
                        break;
                    case this.REVIEW:
                        newEvent = new ReviewEventDto(
                            event.returnValues["userHash"], parseInt(event.returnValues["numberOfReviews"]["_hex"]));
                        break;
                    case this.SEASON:
                        newEvent = new SeasonEventDto(
                            event.returnValues["currentSeason"]);
                        break;
                    default:
                }
                this.dispatcher.dispatch(newEvent);
            } else if (error) {
                this.log.d("Connection error: " + JSON.stringify(error));
                this.web3Service.openConnection();
                this.web3 = this.web3Service.getWeb3();
                this.contract = new this.web3.eth.Contract(this.jsonContractData.abi, this.contractAddress);
                this.registerNewListener(type);
            }
        };

        switch (type) {
            case this.COMMIT:
                this.contract.events.UserNewCommit({ fromBlock: "latest" }, callback);
                break;
            case this.REVIEW:
                this.contract.events.UserNewReview({ fromBlock: "latest" }, callback);
                break;
            case this.SEASON:
                this.contract.events.SeasonEnds({ fromBlock: "latest" }, callback);
                break;
            default:
        }
    }
}
