import { Injectable, HttpService } from "@nestjs/common";
import { BackendConfig } from "../backend.config";
import { ILogger, LoggerService } from "../logger/logger.service";
import { Web3Service } from "../services/web3.service";
import Web3 from "web3";
import { DispatcherService } from "./dispatcher.service";
import { CommitEventDto } from "../dto/events/commit-event.dto";
import { ReviewEventDto } from "../dto/events/review-event.dto";
import { SeasonEventDto } from "../dto/events/season-event.dto";
import { ContractManagerService } from "./contract-manager.service";
import { ITrbSmartContact, ITrbSmartContractJson } from "../models/smart-contracts.model";

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
        private contractManagerService: ContractManagerService,
        private httpSrv: HttpService,
        private dispatcher: DispatcherService
    ) {
        this.log = loggerSrv.get("EventHandlerService");
        this.web3Service = web3Service;
        this.init();
    }

    public init() {
        this.log.d("Initializing Event Handler Service");
        this.contractManagerService.getBrightSmartContract().subscribe(contractAbi => {
            this.jsonContractData = contractAbi;
            this.web3 = this.web3Service.openConnection();
            this.web3.eth.net.isListening()
            .then((res) => {
                this.log.d("Web3 Connection established");
                this.contractAddress = this.jsonContractData.networks[BackendConfig.NET_ID].address;
                this.contract = new this.web3.eth.Contract(this.jsonContractData.abi, this.contractAddress);
                this.eventsSubscription();
            }).catch(e => {
                this.log.e("Not able to open a connection " + e);
            });
        });
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
                            event.returnValues["userHash"], parseInt(event.returnValues["numberOfCommits"]));
                        break;
                    case this.REVIEW:
                        newEvent = new ReviewEventDto(
                            event.returnValues["userHash"], parseInt(event.returnValues["numberOfReviews"]));
                        break;
                    case this.SEASON:
                        newEvent = new SeasonEventDto(
                            event.returnValues["currentSeason"]);
                        break;
                    default:
                        this.log.e("The parameter 'type' is not valid");
                }
                this.dispatcher.dispatch(newEvent);
            }
        };

        switch (type) {
            case this.COMMIT:
                this.contract = new this.web3.eth.Contract(this.jsonContractData.abi, this.contractAddress);
                this.contract.events.UserNewCommit({ fromBlock: "latest" }, callback);
                break;
            case this.REVIEW:
                this.contract = new this.web3.eth.Contract(this.jsonContractData.abi, this.contractAddress);
                this.contract.events.UserNewReview({ fromBlock: "latest" }, callback);
                break;
            case this.SEASON:
                this.contract.events.SeasonEnds({ fromBlock: "latest" }, callback);
                break;
            default:
                this.log.e("The parameter 'type' is not valid");
        }
    }

    private handlerDisconnects(error) {
        this.log.d("Disconnected from Provider");
        this.web3 = this.web3Service.openConnection();
        this.eventsSubscription();
    }

    private eventsSubscription() {
        this.log.d("Setting the event subscriptions");
        this.registerNewListener(this.COMMIT);
        this.registerNewListener(this.REVIEW);
        let provider = this.web3.currentProvider;
        provider.on("close", e => this.handlerDisconnects(e));
        provider.on("end", e => this.handlerDisconnects(e));
    }
}
