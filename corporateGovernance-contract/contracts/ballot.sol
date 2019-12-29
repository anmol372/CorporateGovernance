pragma solidity ^0.5.1;
contract Ballot {

    struct Voter {
        uint shares_held;
        bool voted;
        address proxy;
        uint8 user_level;
         /*
            voter = 1
            manager = 2
            director = 4
            not allowed: 7 (voter+manager+director), 6 (manager+director), or any other values except
            allowed : 5 (director+voter), 3 (manager+director),1 (voter)
        */
        bool set; // This boolean is used to differentiate between unset and zero struct values
    }

    struct vote{
        address voterAddress;
        bool choice;
    }

    uint private countResult = 0;   //total 'yes' votes during voting period
    uint public finalResult = 0;    //stores the final number of 'yes' votes. It remains 0 until voting closes.
    uint public totalVoter = 0;     //total no. of voters
    uint public totalVote = 0;      // total no. of votes
    uint public totalShares = 0;
     uint public totalShareVote = 0;
    //admin’s name, wallet address and proposal are kept as public variables for everyone to see
    address public ballotAddress;     //admin's address
    string public ballotName;
    string public proposal;
    uint8 public access_level;

    enum State { Created, Voting, Ended }
    State public state;

    // Declares a state variable that stores a `Voter` struct for each possible address.
    mapping(address => Voter) public voters;
    mapping(uint => vote) private votes;

    //creates a new ballot contract
    // admin initializes the ballot with their address and name and the ballot state is set to created.
    constructor ( string memory _ballotName, string memory _proposal, uint8 _access_level ) public {
        ballotAddress = msg.sender;
        ballotName = _ballotName;
        proposal = _proposal;
        access_level = _access_level;
        state = State.Created;
    }

    modifier inState(State _state) {
        require(state == _state,
            "Not the correct state for the operation");
        _;
    }

    event voterAdded(address voter);
    event voteStarted();
    event voteEnded(uint finalResult);
    event voteDone(address voter);

    function register_user(address _userAddress, uint _shares_held, bool _manager, bool _director) public
    inState(State.Created)   positiveSharesHeld(_shares_held) onlySelf(_userAddress) {
    Voter storage voter = voters[_userAddress];
    uint8 _user_level = 1;
    // Check that the Voter did not already exist:
    require(
        !voter.set,
        "Voter already exists"
        );
    //Define user prviliges
    if ( _manager == true ) {
        _user_level = 3;
    }
    if ( _director == true ) {
        _user_level = 5;
    }
    //Store the Voter
    voters[_userAddress] = Voter({
        shares_held: _shares_held,
        voted: false,
        proxy: address(0),
        user_level: _user_level,
        set: true
    });
    totalShares = totalShares + _shares_held;
    totalVoter++;
    emit voterAdded(_userAddress);
}
    modifier positiveSharesHeld (uint _shares_held) {
        require(
        _shares_held > 0,
        "User must have shares in the company"
        );
        _;
    }

    modifier onlySelf(address _userAddress) {
        require(msg.sender == _userAddress,
        "A user can only register themselves"
        );
        _;
    }
    
    modifier onlyAdmin() {
        require(msg.sender ==ballotAddress,
            "This operation can only be carried out by a user themselves"
            );
        _;
    }
    
    modifier votedOnce(bool voted) {
        require (voted == false,
        "User has already voted once"
        );
        _;
    }
    

    function assign_proxy(address to) public
    inState(State.Created)
    {
         // assigns reference
        Voter storage sender = voters[msg.sender];
        require(!sender.voted, "You already voted.");
        require(voters[to].set == true, "Proxy Voter must be registered voter.");
        require(to != msg.sender, "Self-delegation is disallowed.");

        // Forward the delegation as long as
        // `to` also delegated.
        while (voters[to].proxy != address(0)) {
            to = voters[to].proxy;

            // A loop in the delegation, not allowed.
            require(to != msg.sender, "Found loop in delegation.");
        }
        sender.voted = true;
        sender.proxy = to;
        Voter storage proxy_ = voters[to];
        proxy_.shares_held += sender.shares_held;
    }



    // add shares to voters profile
    function add_shares(uint _shares_added) public
    inState(State.Created)
    {
        Voter storage sender = voters[msg.sender];
        if (_shares_added >= 0)
        {
            sender.shares_held += _shares_added;
        }
        address _delegate = msg.sender;
        while (voters[_delegate].proxy != address(0)) {
            _delegate = voters[_delegate].proxy;
            voters[_delegate].shares_held += _shares_added;
            // We found a loop in the delegation, not allowed.
            require(_delegate != msg.sender, "Found loop in delegation.");
        }
        totalShares = totalShares + _shares_added;
    }

    // view shares held by sender
    function view_shares() public view
    returns (uint shares_)
    {
        shares_ = voters[msg.sender].shares_held;
    }

    function startVote() public inState(State.Created) onlyAdmin
    {
        state = State.Voting;
        emit voteStarted();
    }

    function Vote(bool _choice) public inState(State.Voting) votedOnce(voters[msg.sender].voted) returns (bool voted)
    {
        bool found = false;

        if ((voters[msg.sender].set) &&
        (voters[msg.sender].proxy == address(0)) &&
        voters[msg.sender].user_level >= access_level)
        {
            voters[msg.sender].voted = true;
            vote memory v;
            v.voterAddress = msg.sender;
            v.choice = _choice;
            if (_choice){
                countResult+=voters[msg.sender].shares_held; //counting on the go
            }
            votes[totalShareVote] = v;
            totalShareVote+=voters[msg.sender].shares_held;
            totalVote++;
            found = true;
        }
        emit voteDone(msg.sender);
        return found;
    }

    function endVote() public inState(State.Voting) onlyAdmin()
    {
        state = State.Ended;
        //finalResult = countResult; //move result from private countResult to public finalResult
        if (countResult > (totalShareVote/2))
        {
            finalResult = 2; //more agree
        } else if (countResult < (totalShareVote/2)) {
            finalResult = 1; //more disagree
        }// else finalResult = 0 //tie
        emit voteEnded(finalResult);
    }
}
