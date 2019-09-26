import { Injectable, HttpService } from "@nestjs/common";
import { BackendConfig } from "../backend.config";
import { ILogger, LoggerService } from "../logger/logger.service";
import { Web3Service } from "../services/web3.service";
import Web3 from "web3";
import { DispatcherService } from "./dispatcher.service";
import { CommitEventDto } from "../dto/events/commit-event.dto";
import { ReviewEventDto } from "../dto/events/review-event.dto";
import { SeasonEventDto } from "../dto/events/season-event.dto";


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
    private contractAbi;

    public constructor(
        web3Service: Web3Service,
        loggerSrv: LoggerService,
        private httpSrv: HttpService,
        private dispatcher: DispatcherService
    ) {
        this.log = loggerSrv.get("EventHandlerService");
        this.web3Service = web3Service;
        this.init();
    }

    public init() {
        this.log.d("Initializing Event Handler Service");
        this.httpSrv.get(BackendConfig.BRIGHT_CONTRACT_URL).subscribe(response => {
            this.contractAbi = response.data;
            this.jsonContractData = this.contractAbi;
            this.web3 = this.web3Service.getWeb3();
            this.web3.eth.net.isListening()
            .then((res) => {
                this.log.d("Web3 Connection established");
                this.contractAddress = this.contractAbi.networks[BackendConfig.netId].address;
                this.contract = new this.web3.eth.Contract(this.jsonContractData.abi, this.contractAddress);
                this.registerNewListener(this.COMMIT);
                this.registerNewListener(this.REVIEW);
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
                        this.log.e("The parameter 'type' is not valid");
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
                this.log.e("The parameter 'type' is not valid");
        }
    }
}
