import { Injectable, HttpService } from "@nestjs/common";
import { BackendConfig } from "../backend.config";
import { ILogger, LoggerService } from "../logger/logger.service";
import { Web3Service } from "../services/web3.service";
import Web3 from "web3";
import { DispatcherService } from "./dispatcher.service";
import { CommitEventDto } from "../dto/events/commit-event.dto";
import { ReviewEventDto } from "../dto/events/review-event.dto";
import { SeasonEventDto } from "../dto/events/season-event.dto";
import { DeleteEventDto } from "../dto/events/delete-event.dto";
import { NewUserEventDto } from "../dto/events/newUser-event.dto";
import { ContractManagerService } from "./contract-manager.service";
import { ITrbSmartContact, ITrbSmartContractJson } from "../models/smart-contracts.model";

@Injectable()
export class EventHandlerService {

    private readonly COMMIT = "Commit";
    private readonly REVIEW = "Review";
    private readonly DELETE = "Delete";
    private readonly NEW_USER = "NewUser";
    private readonly LISTENER_CLOSE_EVENT = "close";
    private readonly LISTENER_END_EVENT = "end";
    private readonly USER_HASH = "userHash";
    private readonly HASH = "hash";
    private readonly TEAM_UID = "teamUid";
    private readonly NUMBER_COMMITS = "numberOfCommits";
    private readonly TIMESTAMP = "timestamp";
    private readonly URL = "url";
    private readonly NUMBER_REVIEWS = "numberOfReviews";
    private readonly LATEST = "latest";
    private readonly FIRST_BLOCK = 0;


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
        this.contractManagerService.getEventDispatcherSmartContract().subscribe(contract => {
            this.contract = contract;
            this.web3 = this.web3Service.openConnection();
            this.web3.eth.net.isListening()
            .then((res) => {
                this.log.d("Web3 Connection established");
                this.eventsSubscription(true);
            }).catch(e => {
                this.log.e("Not able to open a connection " + e);
            });
        });
    }

    public registerNewListener(type: string, initialization = false) {
        this.log.d("New Subscription");
        let callback = (error, event) => {
            if (event) {
                this.log.d("New event received: " + JSON.stringify(event.returnValues));
                let newEvent;
                switch (type) {
                    case this.COMMIT:
                        newEvent = new CommitEventDto(
                            parseInt(event.returnValues[this.TEAM_UID]),
                            event.returnValues[this.USER_HASH], parseInt(event.returnValues[this.NUMBER_COMMITS]), 
                            parseInt(event.returnValues[this.TIMESTAMP]));
                        break;
                    case this.REVIEW:
                        newEvent = new ReviewEventDto(
                            parseInt(event.returnValues[this.TEAM_UID]),
                            event.returnValues[this.USER_HASH], parseInt(event.returnValues[this.NUMBER_REVIEWS]), 
                            parseInt(event.returnValues[this.TIMESTAMP]));
                        break;
                    case this.DELETE:
                        newEvent = new DeleteEventDto(
                            parseInt(event.returnValues[this.TEAM_UID]),
                            event.returnValues[this.USER_HASH], event.returnValues[this.URL]);
                        break;
                    case this.NEW_USER:
                        newEvent = new NewUserEventDto(
                            parseInt(event.returnValues[this.TEAM_UID]),
                            event.returnValues[this.HASH]);
                        break;
                    default:
                        this.log.e("The parameter 'type' is not valid");
                }
                this.dispatcher.dispatch(newEvent).subscribe(res => this.log.d("New event processed"));
            } else if (error) {
                this.log.e("Error registering the event listener", error);
            }
        };

        let block = initialization ? this.FIRST_BLOCK : this.LATEST;

        switch (type) {
            case this.COMMIT:
                this.contract.events.UserNewCommit({ fromBlock: block }, callback);
                break;
            case this.REVIEW:
                this.contract.events.UserNewReview({ fromBlock: block }, callback);
                break;
            case this.DELETE:
                this.contract.events.DeletedCommit({ fromBlock: block }, callback);
                break;
            case this.NEW_USER:
                this.contract.events.NewUserEvent({ fromBlock: block }, callback);
                break;
            default:
                this.log.e("The parameter 'type' is not valid: ", type);
        }
    }

    private handlerDisconnects(error) {
        this.log.d("Disconnected from Provider");
        this.web3 = this.web3Service.openConnection();
        this.eventsSubscription();
    }

    private eventsSubscription(initialization = false) {
        this.log.d("Setting the event subscriptions");
        this.registerNewListener(this.COMMIT, initialization);
        this.registerNewListener(this.REVIEW, initialization);
        this.registerNewListener(this.DELETE, initialization);
        this.registerNewListener(this.NEW_USER, initialization);
        let provider = this.web3.currentProvider;
        provider.on(this.LISTENER_CLOSE_EVENT, e => this.handlerDisconnects(e));
        provider.on(this.LISTENER_END_EVENT, e => this.handlerDisconnects(e));
    }
}
