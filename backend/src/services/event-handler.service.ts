import { Injectable } from "@nestjs/common";
import { ILogger, LoggerService } from "../logger/logger.service";
import { Web3Service } from "../services/web3.service";
import Web3 from "web3";
import { DispatcherService } from "./dispatcher.service";
import { CommitEventDto } from "../dto/events/commit-event.dto";
import { ReviewEventDto } from "../dto/events/review-event.dto";
import { DeleteEventDto } from "../dto/events/delete-event.dto";
import { NewUserEventDto } from "../dto/events/newUser-event.dto";
import { ContractManagerService } from "./contract-manager.service";
import { ITrbSmartContact, ITrbSmartContractJson } from "../models/smart-contracts.model";
import { delayWhen, flatMap, map, retryWhen, tap } from "rxjs/operators";
import { of, timer } from "rxjs";

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
    private readonly VERSION = "brightbyteVersion";
    private readonly URL = "url";
    private readonly NUMBER_REVIEWS = "numberOfReviews";
    private readonly LATEST = "latest";
    private readonly TIME_OUT_MILIS = 10000;
    
    private firstBlockNumber = 0;
    private contractAddressEventDispatcher: string;
    private eventDispatcherContract: ITrbSmartContractJson;
    private contract: ITrbSmartContact;
    private web3: Web3;
    private log: ILogger;

    public constructor(
        loggerSrv: LoggerService,
        private contractManagerService: ContractManagerService,
        private dispatcher: DispatcherService
    ) {
        this.log = loggerSrv.get("EventHandlerService");
        this.init();
    }

    public init() {
        this.log.d("Initializing Event Handler Service");
        Web3Service.getWeb3().pipe(
        flatMap((web3: Web3) => {
            this.web3 = web3;
            return this.contractManagerService.getCurrentBlock();
        }),
        flatMap((blockNumber: number) => {
            this.firstBlockNumber = blockNumber;
            return this.contractManagerService.getEventDispatcherAbi();
        }),
        flatMap((eventDispatcherContract: ITrbSmartContractJson) => {
            this.eventDispatcherContract = eventDispatcherContract;
            return this.contractManagerService.getEventDispatcherContractAddress();
        }))
        .subscribe((contractAddressEventDispatcher: string) => {
            this.contractAddressEventDispatcher = contractAddressEventDispatcher;
            this.contract = new this.web3.eth.Contract(this.eventDispatcherContract.abi, this.contractAddressEventDispatcher);
            this.eventsSubscription(true);
        });
    }

    public registerNewListener(type: string, initialization = false) {
        this.log.d("New Subscription");
        let callback = (error, event) => {
            if (event) {
                const eventVals = event.returnValues;
                this.log.d("New event received: " + JSON.stringify(eventVals));
                let newEvent;
                switch (type) {
                    case this.COMMIT:
                        newEvent = new CommitEventDto(
                            parseInt(eventVals[this.TEAM_UID]),
                            eventVals[this.USER_HASH], parseInt(eventVals[this.NUMBER_COMMITS]), 
                            parseInt(eventVals[this.TIMESTAMP]),
                            parseInt(eventVals[this.VERSION]));
                        break;
                    case this.REVIEW:
                        newEvent = new ReviewEventDto(
                            parseInt(eventVals[this.TEAM_UID]),
                            eventVals[this.USER_HASH], parseInt(eventVals[this.NUMBER_REVIEWS]), 
                            parseInt(eventVals[this.TIMESTAMP]),
                            parseInt(eventVals[this.VERSION]));
                        break;
                    case this.DELETE:
                        newEvent = new DeleteEventDto(
                            parseInt(eventVals[this.TEAM_UID]),
                            eventVals[this.USER_HASH],
                            eventVals[this.URL],
                            parseInt(eventVals[this.VERSION]));
                        break;
                    case this.NEW_USER:
                        newEvent = new NewUserEventDto(
                            parseInt(eventVals[this.TEAM_UID]),
                            eventVals[this.HASH],
                            parseInt(eventVals[this.VERSION]));
                        break;
                    default:
                        this.log.e("The parameter 'type' is not valid");
                }
                this.dispatcher.dispatch(newEvent).subscribe(res => this.log.d("New event processed"));
            } else if (error) {
                this.log.e("Error registering the event listener", error);
            }
        };

        let block = initialization ? this.firstBlockNumber : this.LATEST;

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
        Web3Service.getWeb3().pipe(
        map((web3: Web3) => {
            this.web3 = web3;
            this.contract = new this.web3.eth.Contract(this.eventDispatcherContract.abi, this.contractAddressEventDispatcher);
            this.eventsSubscription();
        }),
        retryWhen(errors => errors.pipe(
            tap(e => this.log.e("Not able to open a connection: ", e)),
            delayWhen(e => {
                return timer(this.TIME_OUT_MILIS);
            })
        ))).subscribe();
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
