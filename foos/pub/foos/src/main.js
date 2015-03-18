div = React.DOM.div
ul  = React.DOM.ul
li  = React.DOM.li
input  = React.DOM.input
button = React.DOM.button

recl = React.createClass

//Render Page
Page = recl({
  render: function(){return (
    div({},
    AddFixture({fixtures:this.props.fixture}),
    Fixtures({fixturesList:this.props.fixturesList}), // don't forget to include the key before the ':' here. 
    Standings({fixturesList:this.props.fixturesList})
    )
  )},
})

AddFixture = recl({
  _handleClick: function() { submit(); },
  _handleKey: function(e) { if(e.keyCode == 13) submit(); },
  submit: function() {
    $el = $(this.getDOMNode())

    bcons = $el.find('#bcons').val().trim()
    bscore = parseInt($el.find('#bscore').val().trim())

    ycons = $el.find('#bcons').val().trim()
    yscore = parseInt($el.find('#yscore').val().trim())

    var bscr = parseInt(bscore.value)
    var yscr = parseInt(yscore.value)

    if(bcons.length === 0 || 
       ycons.length === 0 || 
       isNaN(bscore) || 
       isNaN(yscore)) { 
      alert("Something isn't quite right with your input"); 
      return; 
    }
    valid = this.isValid(bscore,yscore,bcons,ycons)
    if(valid !== true){      // check for valid scoreline
      urb.send({
        appl: "foos",
        data: {
          bcons:bcons, 
          ycons:ycons, 
          bscore:bscore, 
          yscore:yscore
        },
        mark: "json"
      })
      newFixturesList = mounted.props.fixturesList.slice();
      newFixturesList.push({ // dont forget to send object
        bcons:bcons,
        ycons:ycons, 
        bscore:bscore, 
        yscore:yscore,
        pending:true
      })
      mounted.setProps({fixturesList:newFixturesList})
    } else { 
      alert(valid); 
    }
  },

  isValid: function(bscore,yscore,bcons,ycons){
    valid = true
    if(this.validRange(bscore) && this.validRange(yscore)){
      if(bscore == 10 || yscore == 10){
        if(yscore == 10 && bscore == 10) valid = "Scores can't both be 10?"
      } else valid = "Scores aren't quite right"
    } else valid = "Scores aren't quite right"
    if(bcons.toLowerCase() == ycons.toLowerCase())
      valid = "Two players can't be the same!"
    return valid
  },

  validRange: function(score){
    if(score < 0 || score > 10) return false
    return true
  },

  render: function() {
    return div({id:"afix"},
      [div({className:'contestant'},'Contestant'),
       div({className:'score'},'Score'),
       div({className:'score'},'Score'),
       div({className:'contestant'},'Contestant'),
       input({
        className:'contestant black', 
        id:'bcons', 
        onKeyDown:this._handleKey}),
       input({
        className:'score black', 
        id:'bscore', 
        onKeyDown:this._handleKey}),
       input({
        className:'score yellow', 
        id:'yscore', 
        onKeyDown:this._handleKey}),
       input({
        className:'contestant yellow', 
        id:'ycons', 
        onKeyDown:this._handleKey}),
       button({
        id:'entrees', 
        onClick:this._handleClick}, 
        'Submit')
    ])
  }
})

//List all played fixtures
Fixtures = recl({
  render: function(){
    return (ul({className:'fixturesList'}, this.props.fixturesList.map(Fixture)))
  }
})

Fixture = recl({
  render: function() {
    klass = 'fixture'
    if(this.props.pending) klass += ' pending'
    return li({className:klass}, 
            [div({className:'contestant'}, this.props.bcons),
             div({className:'score'}, this.props.bscore),
             div({className:'score'}, this.props.yscore),
             div({className:'contestant'}, this.props.ycons)])
  }
})

//update standings
Standings = recl({
  render: function(){
    var updatedRecords = fixturesToStandings(this.props.fixturesList)
    var sortedRecords = updatedRecords.sort(standingSort)
    heading = li({},
      [div({},'Player'), 
       div({},'Wins'), 
       div({},'Losses')])
    return ul({className:"standings"},[heading, sortedRecords.map(Standing)]) //
  }
})

Standing = recl({
  render: function(){
    return li({},
      [div({},this.props.player), 
       div({},this.props.wins), 
       div({},this.props.losses)])
  }
})

//sort players by record
standingSort = function (a,b){                
  switch(true){
    case a.wins  > b.wins: return 1;
    case a.wins  < b.wins: return -1;
    case a.losses < b.losses: return 1;
    case a.losses > b.losses: return -1;
    default: return (a.player).localeCompare(b.player);
  }
}


fixturesToStandings = function (fixtures) {
  var standings ={}
  for (i in fixtures){
    var fix = fixtures[i]
    if (!standings[fix.bcons]) standings[fix.bcons] = {wins:0, losses:0}
    if (!standings[fix.ycons]) standings[fix.ycons] = {wins:0, losses:0}
    if (fix.bscore == 10){
      var winner = fix.bcons
      var loser = fix.ycons
    }
    else if (fix.yscore == 10){
      var winner = fix.ycons
      var loser = fix.bcons
    } else if(true) throw 'wtf';
    standings[winner].wins++
    standings[loser].losses++
  }
  return Object.keys(standings).map(function(player){
    return({player:player, wins:standings[player].wins, losses:standings[player].losses})
  })
}

$(document).ready(function() {
  mounted = React.render(Page({players:[], fixturesList:[]}), $("#container")[0])
  urb.subscribe({
    appl: "foos",
    path: "/"
  }, function(err,d){
    if(d.data.ok) return;
    mounted.setProps({fixturesList:d.data})
  })
})