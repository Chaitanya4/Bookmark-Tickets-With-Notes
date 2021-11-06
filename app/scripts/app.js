'use strict';
var i=0;
document.addEventListener("DOMContentLoaded", function () {
  let displayId = '', userId = '', tickets = [], currentTicketObj = {}, domainName = '';

  function renderApp() {
    return Promise.all([client.data.get('loggedInUser'), client.data.get('ticket'), client.data.get('domainName')]);
  }

  // Saves the changes to the db
  function setBookmarks() {
  
    client.db.set("ticket_bookmarks:" + userId,{tickets:tickets})
      .then(null, function (error) {
        client.interface.trigger("showNotify", {
          type: "danger",
          title: "Error",
          message: "Changes could not be saved. Please try again."
        });
        console.log(error);
      }).finally(function () {
      displayBookmarks();
    });
    console.log(tickets);
    note.value="";
  }

  // Gets the bookmarks from the db
  function getBookmarks() {
    return client.db.get("ticket_bookmarks:" + userId);
  }

  // Picks specific keys from the object
  function pickKeysFromObj(ticketObj) {
    let arr = ['display_id', 'subject', 'description_text','notes'];
    let trimmedObj = {};
    arr.forEach(function (val) {
      trimmedObj[val] = ticketObj[val];
    });
    if(document.getElementById('note').value == '')
    {
      trimmedObj['notes']="No personal note was added for this ticket.";
    }
    else{
      trimmedObj['notes']=document.getElementById('note').value;
    }
    
    return trimmedObj;
  }

  // Updates the tickets array
  function changeBookmarks(type, ticketObj) {
    console.log(tickets);
    getBookmarks().then(function (result) {
      let index = (result.tickets || []).map(function (ticket) {
        return ticket.display_id;
      }).indexOf(ticketObj.display_id);
      if (type === 'add') {
        if (index < 0) {
          tickets.push(pickKeysFromObj(currentTicketObj));
          setBookmarks();
        }
      } else if (type === 'remove') {
        if (index > -1) {
          tickets.splice(index, 1);
          console.log(tickets);
          setBookmarks();
        }
      }
    }, function (error) {
      if (error.status === 404 && type === 'add') {
        tickets = [pickKeysFromObj(currentTicketObj)];
        setBookmarks();
      }
    });
  }

  //Displays the updated the list in the UI
  function displayBookmarks() {
    let bookmark = document.getElementsByClassName('bookmarks-ul')[0];
    bookmark.innerHTML = '';

    function setTemplate({display_id, domainName, subject}) {
      return `<li class="bookmarks-li"><b><a href="https://${domainName}/helpdesk/tickets/${display_id}" target="_blank" class="bookmark-link">${subject}</a></b></li>`;
    }
    tickets.forEach(function (val) {
      val.domainName = domainName;
      bookmark.innerHTML += setTemplate(val);
    });

    if (tickets.find(function (val) {
      return val.display_id === displayId;
    })) {
      document.getElementById('add_to_bookmarks').disabled = true;
      document.getElementById('note').style.display="none";
      document.getElementById('sbutton').style.display="none";
      document.getElementById("interim").style.display="none";
      
    } else {
      document.getElementById('add_to_bookmarks').disabled = false;
      document.getElementById('note').style.display="block";
      document.getElementById('sbutton').style.display="block";
      document.getElementById("interim").style.display="block";
     
      
    }

    let bookmarksList = document.getElementsByClassName('bookmarks-li');
    if (bookmarksList > 0) {
      bookmarksList.forEach(function (index, el) {
        $clamp(el, {clamp: 2});
      });
    }
  }

  app.initialized().then(function (client) {
    window.client = client;
    var recognizing;
    window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
var recognition = new SpeechRecognition();
recognition.continuous = true;
recognition.interimResults = true;
reset();
recognition.onend = reset();
    renderApp().then(function (value) {
      userId = value[0].loggedInUser.id;
      displayId = value[1].ticket.display_id;
      domainName = value[2].domainName;

      currentTicketObj = value[1].ticket;
      if (userId && displayId) {
        getBookmarks().then(function (records) {
          tickets = records.tickets || [];
          displayBookmarks();
        });
      }
    });
    function reset() {
      recognizing = false;
      document.getElementById("sbutton").innerHTML = "Click to Start Giving Voice Notes";
    }
    recognition.onresult = function (event) {
      let interim_transcript = "";
      for (var i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          note.value += event.results[i][0].transcript;
        }
        else {
          interim_transcript += event.results[i][0].transcript;
          document.getElementById("interim").innerHTML=interim_transcript;
        }
      }
    }
    
    document.getElementById('sbutton').addEventListener('click', function () {
      console.log("speak");
      console.log(recognizing);
      if (recognizing) {
        recognition.stop();
        reset();
      } else {
        recognition.start();
        recognizing = true;
        console.log(recognizing);
        document.getElementById("sbutton").innerHTML = "Click to Stop Listening";
      }
    });

    document.getElementById('add_to_bookmarks').addEventListener('click', function () {
      console.log("data");
      console.log(client.data.get('ticket'));
      document.getElementById('interim').innerHTML="";
      recognition.stop();
      recognizing =false;
      document.getElementById("sbutton").innerHTML = "Click to Start Giving Voice Notes";
      if (userId && displayId) {
        changeBookmarks('add', currentTicketObj);
      }
    });

    document.getElementById('manage_bookmarks').addEventListener('click', function () {
      client.interface.trigger("showModal", {
        title: "Manage Bookmarked Tickets",
        template: "views/modal.html",
        data: {
          tickets: tickets,
          userId: userId
        }
      });
    });
    
    client.instance.receive(
      function (event) {
        let data = event.helper.getData();
        console.log("recdata");
        console.log(data.ticketId);
        console.log(data.type);
        if (data.type === 'removeTicket') {
          changeBookmarks('remove', {display_id: data.ticketId});
        }
      }
    );
  });
});