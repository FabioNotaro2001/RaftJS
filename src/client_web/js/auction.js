$(document).ready(function () {
    let url = new URL(window.location.href);
    let ID = url.searchParams.get('ID');
    printInfoObj();
    loadBids();

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
        
        let highestPrice = $(".offerPrice")[0];

        if (highestPrice != null && Number(highestPrice.text()) >= datas.price) {
            addAlert("alert2","alert-danger","Specificare un prezzo più alto dell'ultima offerta.","");
        }

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
                loadBids();
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

// 2 minuti

function printInfoObj(){
    // TODO Prendo le info dal database dell'oggetto che all'asta e le stampo.
    let url = new URL(window.location.href);
    let id = url.searchParams.get('id');
    let jsonData = JSON.stringify({ auctionId: id });

    $.ajax({
        type: "POST",
        url: "/getAuction",
        data: jsonData,
        processData: false,
        contentType: "application/json"
    })
    .done(function (data, success, response) {
        let informazioni = data;

        let html = '';
        html+=`
        <div class="card mb-3">
            <div class="card-body">
                <div class="row">
                    <div class="col-md-6">
                        <h3 class="card-title h3">Oggetto: ${informazioni.objName}</h3>
                        <p class="card-title h4">Creatore: ${informazioni.creator}</p>
                    </div>
                    <div class="col-md-6 text-end">
                        <p class="h3">Offerta corrente: ${informazioni.highestBidValue ?? informazioni.startingPrice}€</p>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-12">
                        <p class="card-text">${informazioni.objDesc}</p>
                    </div>
                </div>
            </div>
        </div>
    
        `;
        $("#ogg_vinc").html(html);
    })
    .fail(function (response) {
        console.log(response);
    });

}

function loadBids(){
    let url = new URL(window.location.href);
    let id = url.searchParams.get('id');
    let jsonData = JSON.stringify({ auctionId: id });

    let offerte;
    // TODO Prendo tutte le offerte dal database che ci sono e le stampo. Necessito delle offerte.
    $.ajax({
        type: "POST",
        url: "/getBids",
        data: jsonData,
        processData: false,
        contentType: "application/json"
    })
    .done(function (data, success, response) {
        let html = '';
        let first = true;
        for(off of offerte){
            html+=`
            <tr class="${first ? "table-secondary " : ""}offer">
                <td>${off.utente}</td>
                <td>${off.data}</td>
                <td class="offerPrice">${off.prezzo}</td>
            </tr>
            `;
            first = false;
        }
        $("#cont_aste").html(html);
    })
    .fail(function (response) {
        console.log(response);
    });
}