'use strict';

function setTemplate({display_id, domainName, subject,notes}) {
  return `
    <li data-ticket-id="${display_id}" class="row manage-bm-li">\
    <span>
      <div class="ticket-title" ><h4><b><a href="https://${domainName}/helpdesk/tickets/${display_id}" target="_blank" >${subject}</a></b></h4></div>\
      <div class="ticket-title" style="color:#475867"><b>Added note: </b>${notes}</div>\
    </span>
      <span class="remove-ticket-bm" ><a class="remove-bookmark"><img src="../styles/images/delete.svg" style="width:30px;height:50px;"/></a></span>\
    </li>
  `;
}

function getParent(elem, parentSelector) {
  for (; elem && elem !== document; elem = elem.parentNode) {
    if (elem.className.includes(parentSelector)) return elem;
  }
  return null;
}

document.addEventListener("DOMContentLoaded", function () {
  app.initialized()
    .then(function (_client) {
      let client = _client;
      client.instance.context()
        .then(function (context) {
          context.data.tickets.forEach(function (ticket) {
            document.getElementsByClassName('manage-bm-ul')[0].innerHTML += setTemplate(ticket);
          })

          document.getElementsByClassName('remove-bookmark').forEach(function (el) {
            el.addEventListener('click', function () {
              let parent = getParent(this, 'manage-bm-li');
              let ticketId = parseInt(parent.dataset.ticketId);
              console.log('data');
              console.log(parent.dataset.ticketId);
              parent.remove();
              client.instance.send({
                message: {type: 'removeTicket', ticketId: ticketId}
              });
            })
          });

          document.getElementsByClassName('manage-bm-ul, ticket-title').forEach(function (index, el) {
            $clamp(el, {clamp: 2});
          });
        });
    });
});