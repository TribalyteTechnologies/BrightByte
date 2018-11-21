pragma solidity 0.4.21;
import "./Root.sol";

contract Commits {
    Root private root;
    address private rootAddress;
    bytes32[] private allCommitsArray;
    mapping (bytes32 => Commit) private storedData;

    address private owner;

    struct Commit {
        string title;
        string url;
        address author;
        uint creationDate;
        bool isReadNeeded;
        uint lastModificationDate;
        uint numberReviews;
        uint currentNumberReviews;
        uint score;
        uint points;
        address[] pendingComments;
        address[] finishedComments;
        mapping (address => Comment) commitComments;
    }
    struct Comment{
        string text;
        address author;
        uint score;
        uint vote; //0 => no vote, 1 => dont agree, 2 => agree
        uint creationDate;
        uint lastModificationDate;
        bool isReadNeeded;
    }
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    function Commits() public {
        owner = msg.sender;
    }
    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }
    modifier onlyRoot() {
        require(msg.sender == rootAddress);
        _;
    }
    modifier onlyDapp() {
        require (msg.sender == rootAddress || msg.sender == tx.origin);
        _;
    }

    function init(address _root) public {
        require(rootAddress == uint80(0));
        root = Root(_root);
        rootAddress = _root;
    }

    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0));
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
    function setRootAddress(address a) public onlyOwner {
        root = Root(a);
        rootAddress = a;
    }

    function setNewCommit (string _title, string _url, uint _users) public onlyDapp {
        address auth = tx.origin;
        address[] memory a;
        bytes32 _id = keccak256(_url);
        if(storedData[_id].author == address(0)){
            storedData[_id] = Commit(_title, _url, msg.sender, block.timestamp, false, block.timestamp,_users, 0, 0, 0, a,a);
            allCommitsArray.push(_id);
            if(msg.sender == tx.origin){
                root.setNewCommit(_id);
            }
        } else {
            require(storedData[_id].author == auth);
            storedData[_id].title = _title;
        }
    }
    function notifyCommit(bytes32 url,address a) public onlyRoot {
        require(storedData[url].author == tx.origin);
        bool saved = false;
        for(uint i = 0; i < storedData[url].pendingComments.length; i++){
            if(a == storedData[url].pendingComments[i]){
                saved = true;
                break;
            }
        }
        if(!saved){
            for(i = 0; i < storedData[url].finishedComments.length; i++){
                if(a == storedData[url].finishedComments[i]){
                    saved = true;
                    break;
                }
            }
        }
        if(!saved){
            storedData[url].pendingComments.push(a);
        }
    }
    function getDetailsCommits(bytes32 _url) public onlyDapp view returns(string, string, address, uint, uint, bool, uint, uint, uint){
        bytes32 id = _url;
        Commit memory data = storedData[id];
        return (data.url,
                data.title,
                data.author,
                data.creationDate,
                data.lastModificationDate,
                data.isReadNeeded,
                data.numberReviews,
                data.currentNumberReviews,
                data.score
        );
    }
    function getCommitScore(bytes32 _id) public onlyDapp view returns(uint,uint){
        return(storedData[_id].score,storedData[_id].points);
    }
    function getNumbers() public onlyDapp view returns(uint){
        return allCommitsArray.length;
    }
    function getAllCommitsId(uint index) public onlyDapp view returns(bytes32){
        return allCommitsArray[index];
    }
    function getNumbersNeedUrl(bytes32 _url) public onlyDapp view returns (uint, uint){
        return (storedData[_url].pendingComments.length,
                storedData[_url].finishedComments.length
        );
    }
    function getCommentsOfCommit(bytes32 _url) public onlyDapp view returns(address[],address[]){
        return (
            storedData[_url].pendingComments,
            storedData[_url].finishedComments
        );
    }
    function getCommentDetail(bytes32 url, address a) public onlyDapp view returns(string,uint,uint,uint,uint,address){
        if(storedData[url].author != tx.origin){
            a = tx.origin;
        }
        return(
            storedData[url].commitComments[a].text,
            storedData[url].commitComments[a].score,
            storedData[url].commitComments[a].vote,
            storedData[url].commitComments[a].creationDate,
            storedData[url].commitComments[a].lastModificationDate,
            storedData[url].commitComments[a].author
        );
    }
    function setReview(string _url,string _text, uint256 _points) onlyDapp public{
        bytes32 url = keccak256(_url);
        address author = tx.origin;

        bool saved = false;
        for (uint j = 0;j < storedData[url].pendingComments.length; j++){
            if (author == storedData[url].pendingComments[j]){
                storedData[url].pendingComments[j] = storedData[url].pendingComments[storedData[url].pendingComments.length-1];
                storedData[url].pendingComments.length--;
                saved = true;
                break;
            }
        }
        require(saved);
        storedData[url].finishedComments.push(author);

        storedData[url].commitComments[author].text = _text;
        storedData[url].commitComments[author].author = author;
        storedData[url].commitComments[author].score = _points/100;
        storedData[url].commitComments[author].creationDate = block.timestamp;
        storedData[url].commitComments[author].lastModificationDate = block.timestamp;

        storedData[url].isReadNeeded = true;
        storedData[url].currentNumberReviews ++;
        storedData[url].lastModificationDate = block.timestamp;
        //score per commit
        uint points = storedData[url].points;
        storedData[url].points = points + _points;
        storedData[url].score = storedData[url].points/storedData[url].finishedComments.length;
        root.setReview(url,storedData[url].author,_points);
    }
    function setVote(bytes32 url, address user, uint8 vote) public onlyRoot {
        require(storedData[url].author == tx.origin);
        assert(vote == 1 || vote == 2);
        require(storedData[url].commitComments[user].author == user);
        storedData[url].commitComments[user].vote = vote;
    }
    function readCommit(bytes32 _url) public onlyRoot {
        if(storedData[_url].author == tx.origin){
            storedData[_url].isReadNeeded = false;
        } else if (storedData[_url].commitComments[tx.origin].author == tx.origin){
            storedData[_url].commitComments[tx.origin].isReadNeeded = false;
        }
    }
    function isCommit(bytes32 _url) public onlyRoot view returns(bool,bool){
        bool yes = false;
        bool auth = false;
        if(storedData[_url].author != address(0)){
            yes = true;
            if(storedData[_url].author == tx.origin){
                auth = true;
            }
        }
        return (yes,auth);
    }
}
