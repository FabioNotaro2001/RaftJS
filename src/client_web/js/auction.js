
// TODO Parte di prova da cancellare dopo.
let offerte = [
    { utente:"Pino", prezzo:300, data:"21/08/2001" },
    { utente:"Pingu", prezzo:200, data:"12/07/2001" }
];

// TODO Parte di prova da cancellare dopo.
let informazioni = { descrizione: "Questa è una descrizione dell'oggetto.", prezzo: 300, oggetto: "Lumaca" };

$(document).ready(function () {
    let url = new URL(window.location.href);
    let ID = url.searchParams.get('ID');
    printInfoObj();
    printAllOffers();

    $("#logout").on("click", function() {
        const datas = new getFormData();
        const jsonData = JSON.stringify(datas);
        $.ajax({
            type: "POST",
            url: "/logoutuser",
            data: jsonData,
            processData: false,
            contentType: "application/json"
        })
        .done(function (data, success, response) {
            console.log(success);
            if(success!=="success"){
                addAlert("alert","alert-danger","Errore nella disconnesione.","");
            } else {
                window.location.href="/login";
            }
        })
        .fail(function (response) {
            console.log(response);
        });
    });
    

    // TODO Aggiungi offerta al database e aggiorna l'interfaccia.
    $("form").submit(function (event) {
        event.preventDefault(); 
        const datas = getFormData("form_ast");
        const jsonData = JSON.stringify(datas);
        //TODO prendere l'ultimo prezzo corrente dell'asta e confornare se il prezzo è minore.
        $.ajax({
            type: "POST",
            url: "/checkOffer",
            data: jsonData,
            processData: false,
            contentType: "application/json"
        })
        .done(function (data, success, response) {
            if(success==="success"){
                //TODO prendi l'ultimo prezzo e cambia 300 grazie alla richiesta sopra.
                if(datas.price>300){
                    $.ajax({
                        type: "POST",
                        url: "/addOffer",
                        data: jsonData,
                        processData: false,
                        contentType: "application/json"
                    })
                    .done(function (data, success, response) {
                        if(success!=="success"){
                            addAlert("alert2","alert-danger","Errore nell'inserimento dell'offerta.","");
                        } else {
                            $("#myModal").modal('toggle');
                            //TODO Cancella questa riga.
                            offerte.push({ utente:"Pino", prezzo:400, data:"21/08/2001" })
                            printInfoObj();
                            printAllOffers();
                        }
                    })
                    .fail(function (response) {
                        console.log(response);
                    });
                } else {
                    addAlert("alert2","alert-danger","Il prezzo dell'offerta non può essere più basso dell'ultimo.","");
                }
            }     
        })
        .fail(function (response) {
            console.log(response);
        });
    });

    $("#clsModal").on("click", function() {
        $("#myModal").modal('toggle');
    });
    
    $("#openModalButton").on("click", function() {
        $("#myModal").modal('toggle');
    });
});

function printInfoObj(){
    // TODO Prendo le info dal database dell'oggetto che all'asta e le stampo.
    // $.ajax({
    //     type: "POST",
    //     url: "/getAllAuctions",
    //     data: jsonData,
    //     processData: false,
    //     contentType: "application/json"
    // })
    // .done(function (data, success, response) {
    //     //TODO Aste=data
    // })
    // .fail(function (response) {
    //     console.log(response);
    // });

    let html = '';
    html+=`
    <div class="card mb-3">
        <div class="card-body">
            <div class="row">
                <div class="col-md-6">
                    <h3 class="card-title h3">Oggetto: ${informazioni.oggetto}</h3>
                </div>
                <div class="col-md-6 text-end">
                    <p class="h3">Offerta corrente: ${informazioni.prezzo}€</p>
                </div>
            </div>
            <div class="row">
                <div class="col-md-12">
                    <p class="card-text">${informazioni.descrizione}</p>
                </div>
            </div>
        </div>
    </div>

    `;
    $("#ogg_vinc").html(html);
}

function printAllOffers(){
    // TODO Prendo tutte le offerte dal database che ci sono e le stampo. Necessito delle offerte.
    // $.ajax({
    //     type: "POST",
    //     url: "/getAllAuctions",
    //     data: jsonData,
    //     processData: false,
    //     contentType: "application/json"
    // })
    // .done(function (data, success, response) {
    //     //TODO Aste=data
    // })
    // .fail(function (response) {
    //     console.log(response);
    // });


    let html = '';
    let t = true;
    for(off of offerte){
        if(t){
            html+=`
            <tr class="table-secondary">
                <td>${off.utente}</td>
                <td>${off.data}</td>
                <td>${off.prezzo}</td>
            </tr>
            `;
            t = false;
        } else {
            html+=`
            <tr>
                <td>${off.utente}</td>
                <td>${off.data}</td>
                <td>${off.prezzo}</td>
            </tr>
            `;
        }
    }
    $("#cont_aste").html(html);
}