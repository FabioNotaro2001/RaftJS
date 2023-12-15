$(document).ready(function () {
    let url = new URL(window.location.href);
    let id = url.searchParams.get('id');
    // printInfoObj();
    // loadBids();
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
                <td>${new Date(off.bidDate).toDateString()}</td>
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