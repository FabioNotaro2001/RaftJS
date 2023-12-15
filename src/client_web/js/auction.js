//TODO: Mostrare una stringa che dice se chiusura dell'asta presente.
$(document).ready(function () {
    let url = new URL(window.location.href);
    let id = url.searchParams.get('id');
    printInfoObj();
    loadBids();
    $("#logout").on("click", function() {
        $.ajax({
            type: "POST",
            url: "/logoutuser",
            data: "{}",
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

    $("#closeAuction").on("click", function() {
        const jsonData = JSON.stringify({auctionId: id});
        $.ajax({
            type: "POST",
            url: "/closeAuction",
            data: jsonData,
            processData: false,
            contentType: "application/json"
        })
        .done(function (data, success, response) {
            console.log(success);
            if(success!=="success"){
                addAlert("alert","alert-success","Asta chiusa con successo!","");
            } else {
                addAlert("alert","alert-danger","Errore! Chiusura asta chiusa non riuscita!","");
            }
        })
        .fail(function (response) {
            console.log(response);
        });
    });
    
    $("form").submit(function (event) {
        let url = new URL(window.location.href);
        let id = url.searchParams.get('id');

        event.preventDefault(); 
        let datas = getFormData("form_ast");
        datas.auctionId = id;
        const jsonData = JSON.stringify(datas);
        
        let highestPrice = $(".offerPrice")[0];

        if (highestPrice != null && Number(highestPrice.textContent) >= datas.price) {
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

function printInfoObj(){
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

        let userCookie = document.cookie.split("user=")[1];

        if(informazioni.creator == userCookie){
            $("#closeAuction").removeClass("btn-hidden");
        } else{
            $("#openModalButton").removeClass("btn-hidden");
        }

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
                            <p class="h3">Offerta corrente: ${informazioni.highestBid ?? informazioni.startingPrice}€</p>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-12">
                            <p class="card-text">${informazioni.objDesc}</p>
                        </div>
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
        for(off of data){
            html+=`
            <tr class="${first ? "table-secondary " : ""}offer">
                <td>${off.userMaker}</td>
                <td>${new Date(off.bidDate).toLocaleString()}</td>
                <td class="offerPrice">${off.bidValue}</td>
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