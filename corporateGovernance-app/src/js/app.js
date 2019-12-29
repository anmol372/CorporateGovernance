App = {
    web3Provider: null,
    contracts: {},
    url: 'http://127.0.0.1:7545',
    ballotAddress: null,
    ballotName: '',
    proposal: '',
    access_level: 0,
    state: 0,
    currentAccount: null,
    finalResult: 0,
    totalVoter: 0,
    totalVote: 0,
    init: function() {
        return App.initWeb3();
    },

    initWeb3: function() {
        // Is there is an injected web3 instance?
        if (typeof web3 !== 'undefined') {
            App.web3Provider = web3.currentProvider;
        } else {
            // If no injected web3 instance is detected, fallback to the TestRPC
            App.web3Provider = new Web3.providers.HttpProvider(App.url);
        }
        web3 = new Web3(App.web3Provider);

        ethereum.enable();
        //App.populateAddress();
        return App.initContract();
    },

    initContract: function() {
        //Get ABI
        $.getJSON('Ballot.json', function(data) {
            // Get the necessary contract artifact file and instantiate it with truffle-contract
            App.contracts = TruffleContract(data);

            // Set the provider for our contract
            App.contracts.setProvider(App.web3Provider);

            //listen to events emitted by smart contract.
            App.getEvents();

            App.getballotName();
            App.getProposal();
            App.getballotAddress();
            App.getaccess_level();
            App.getTotalVoter();
            App.getphase();
            App.getTotalVotes();
            App.getFinalResult();
            App.getTotalSharesRegistered();
            App.getTotalSharesVote();

            //return App.bindEvents();
        });
    },

    getEvents: function() {
        App.contracts.deployed().then(function(instance) {
            var events = instance.allEvents(function(error, log) {
                if (!error)
                    $("#eventsList").prepend('<li>' + log.event + '</li>');
                // Using JQuery, we will add new events to a list in our index.html
            });
        }).catch(function(err) {
            console.log(err.message);
        });
    },


    getballotName: function() {
        App.contracts.deployed().then(function(instance) {
            return instance.ballotName.call();
        }).then(function(result) {
            $("#officialname").text(result);
        }).catch(function(err) {
            console.log(err.message);
        });
    },

    getProposal: function() {
        App.contracts.deployed().then(function(instance) {
            return instance.proposal.call();
        }).then(function(result) {
            $("#proposal").text(result);
        }).catch(function(err) {
            console.log(err.message);
        });
    },

    getballotAddress: function() {
        App.contracts.deployed().then(function(instance) {
            return instance.ballotAddress.call();
        }).then(function(result) {
            $("#address").text(result); // Using JQuery again, we will modify the html tag with id ballotAddress with the returned text from our call on the instance of the wrestling contract we deployed
        }).catch(function(err) {
            console.log(err.message);
        });
    },

    getphase: function() {
        var elem = document.getElementById("state_change");
        App.contracts.deployed().then(function(instance) {
            return instance.state.call();
        }).then(function(result) {
            //console.log(result.toNumber());
            App.state = result.toNumber();
            if (App.state == 0) {
                $("#phase").text("Ballot Created");
                elem.value = "Start Vote";
            } else if (App.state == 1) {
                $("#phase").text("Voting Started");
                elem.value = "End Vote";
            } else if (App.state == 2) {
                $("#phase").text("Voting Ended");
                elem.value = "Voting Over";
            }
        }).catch(function(err) {
            console.log(err.message);
        });
    },

    changeState: function(elem) {
        //var elem = document.getElementById("state_change");
        App.contracts.deployed().then(function(instance) {
            return instance.state.call();
        }).then(function(result) {
            App.contracts.deployed().then(function(instance) {
                App.state = result.toNumber();
                if (App.state == 0) {
                    instance.startVote();
                    elem.value = "End Vote";
                } else if (App.state == 1) {
                    instance.endVote();
                    elem.value = "Voting Ended";
                } else if (App.state == 2) {
                    alert("No next phase defined");
                    App.getFinalResult();
                }
            }).catch(function(err) {
                console.log(err.message);
            });
            //App.getphase();
        }).catch(function(err) {
            console.log(err.message);
            alert('Due to the open issue with web3 (www.github.com/ethereum/web3.js/issues/1707) we cannot provide a more precise error at the moment)\nThe error may be due to one of the following reasons:\n1. Only the admin may change to next state');
        });
        //location.reload();
    },

    getaccess_level: function() {
        App.contracts.deployed().then(function(instance) {
            return instance.access_level.call();
        }).then(function(result) {
            App.access_level = result.toNumber();
            if (App.access_level == 1) {
                $("#access_level").text("Open to All Investors");
            } else if (App.access_level == 3) {
                $("#access_level").text("Open to all Managers and Directors");
            } else if (App.access_level == 5) {
                $("#access_level").text("Open to all Directors");
            }
            //console.log(result.toNumber());
        }).catch(function(err) {
            console.log(err.message);
        });
    },
    getTotalVoter: function() {
        App.contracts.deployed().then(function(instance) {
            return instance.totalVoter.call();
        }).then(function(result) {
            $("#tVoter").text(result.toNumber());
        }).catch(function(err) {
            console.log(err.message);
        });
    },


    registerUser: function() {
        var address = $('#user_address').val();
        //console.log(address);
        var share_held = $('#shares_held').val();
        //console.log(share_held);
        var level = document.querySelector('input[name = "access_level"]:checked').value;
        //console.log(level);
        var position_m = false;
        var position_d = false;
        if (level == 3) {
            var position_m = true;
            var position_d = false;
        } else if (level == 5) {
            var position_m = false;
            var position_d = true;
        }
        App.contracts.deployed().then((instance) => {
            console.log(instance);
            instance.register_user(address, share_held, position_m, position_d).then(function(success) {
                if (success) {
                    console.log('Registered user for ballot');
                    alert('Registered user for ballot');
                } else {
                    console.log('error registering user for ballot');
                    alert('Error registering user for ballot')
                }
            }).catch(function(e) {
                console.log('error creating user: ', address, ': ', e);
                alert('Due to the open issue with web3 (www.github.com/ethereum/web3.js/issues/1707) we cannot provide a more precise error at the moment)\nThe error may be due to one of the following reasons:\n1. The Dapp voting state does not permit the operation.\nState must be : Ballot Created\n2.The registering user must hold positive shares in XYZ Corporation Ltd.\n3. A user may only self register\n4. Voter must not already be registered for the ballot');
            });
        });
    },
    proxyVoter: function() {
        var address = $('#proxy_address').val();

        App.contracts.deployed().then((instance) => {
            console.log(instance);
            instance.assign_proxy(address).then(function(success) {
                if (success) {
                    console.log('Proxy voter added successfully');
                } else {
                    console.log('error assigning proxy');
                }
            }).catch(function(e) {
                console.log('error casting vote: ', e);
                alert('Due to the open issue with web3 (www.github.com/ethereum/web3.js/issues/1707) we cannot provide a more precise error at the moment.\nThe error may be due to one of the following reasons.\n1. The Dapp voting state does not permit the operation.\nState must be : Ballot Created\n2. The User attempted to self delegate\n3. Adding Delegate would result in a loop');
            });
        });
    },

    addShares: function() {
        var shares = $('#newShares').val();

        App.contracts.deployed().then((instance) => {
            console.log(instance);
            instance.add_shares(shares).then(function(success) {
                if (success) {
                    console.log('Shares added to voter successfully');
                } else {
                    console.log('error adding shares');
                }
            }).catch(function(e) {
                console.log('error casting vote: ', e);
                alert('Due to the open issue with web3 (www.github.com/ethereum/web3.js/issues/1707) we cannot provide a more precise error at the moment.\nThe error may be due to one of the following reasons.\n1. The Dapp voting state does not permit the operation.\nState must be : Ballot Created.\n2.The number of shares to be added must be positive.');
            });
        });
    },

    vote: function() {
        var vote;
        if ($('#yes').val() == 1) {
            vote = true;
        } else {
            vote = false;
        }

        App.contracts.deployed().then((instance) => {
            console.log(instance);
            instance.Vote(vote).then(function(success) {
                if (success) {
                    console.log('vote casted successfully');
                } else {
                    console.log('vote casting failed');
                }
            }).catch(function(e) {
                console.log('error casting vote: ', e);
                alert('Due to the open issue with web3 (www.github.com/ethereum/web3.js/issues/1707) we cannot provide a more precise error at the moment.\nThe error may be due to one of the following reasons:\n1. The Dapp voting state does not permit the operation.\nState must be : Voting Started.\n 2. User may have voted already, or assigned a proxy voter.\n');
            });
        });
    },

    getVoter: function() {
        web3.eth.getAccounts((error, accounts) => {
            //console.log(accounts[0])
            App.contracts.deployed().then((instance) => {
                return instance.voters.call(accounts[0]);
            }).then((result) => {
                //console.log(typeof result);
                var val = Object.values(result)
                //console.log(Object.values(result));
                //console.log(val[2]);
                $("#voterdetails").prepend('<h4> Voter Details:</h4><li>Address: ' + accounts[0] + '</li><li> Total Shares: ' + val[0].toNumber() + '</li><li> Voted: ' + val[1] + '</li><li> Delegation: ' + val[2] + '</li><li> User Level: ' + val[3] + '</li>');
            }).catch(function(err) {
                console.log(err.message);
            });
        });
    },

    getTotalVotes: function() {
        App.contracts.deployed().then(function(instance) {
            return instance.totalVote.call();
        }).then(function(result) {
            if (App.state == 1 || App.state == 2) {
                $("#totalVotes").text(result.toNumber());
            } else {
                $("#totalVotes").text("NA");
            }
        }).catch(function(err) {
            console.log(err.message);
        });
    },

    getTotalSharesRegistered: function() {
        App.contracts.deployed().then(function(instance) {
            return instance.totalShares.call();
        }).then(function(result) {
            if (App.state == 1 || App.state == 2) {
                $("#totalShares").text(result.toNumber());
            } else {
                $("#totalShares").text("NA");
            }
        }).catch(function(err) {
            console.log(err.message);
        });
    },

    getTotalSharesVote: function() {
        App.contracts.deployed().then(function(instance) {
            return instance.totalShareVote.call();
        }).then(function(result) {
            if (App.state == 1 || App.state == 2) {
                $("#totalShareVote").text(result.toNumber());
            } else {
                $("#totalShareVote").text("NA");
            }
        }).catch(function(err) {
            console.log(err.message);
        });
    },

    getFinalResult: function() {
        App.contracts.deployed().then(function(instance) {
            return instance.finalResult.call();
        }).then(function(result) {
            if (App.state == 2) {
                //$("#finalResult").text(result.toNumber());
                console.log(result.toNumber());
                if (result.toNumber() == 2) {
                    $("#finalResult").text("Majority Agree. Ballot Passed");
                } else if (result.toNumber() == 1) {
                    $("#finalResult").text("Majority Disagree. Ballot did not pass");
                } else if (result.toNumber() == 0) {
                    $("#finalResult").text("No Clear Majority. Ballot tied");
                }
            } else {
                $("#finalResult").text("NA");
            }
        }).catch(function(err) {
            console.log(err.message);
        });
    }





};

$(function() {
    $(window).load(function() {
        App.init();
    });
});