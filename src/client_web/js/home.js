$(document).ready(function () {
    fetchOpenAuctions();

    $("#logout").on("click", function () {
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
                if (success !== "success") {
                    addAlert("alert", "alert-danger", "Errore nella disconnesione.", "");
                } else {
                    window.location.href = "/login";
                }
            })
            .fail(function (response) {
                console.log(response);
            });
    });



    $("form").submit(function (event) {
        event.preventDefault();
        const datas = getFormData("form_ast");
        const jsonData = JSON.stringify(datas);
        console.log(jsonData);
        $.ajax({
            type: "POST",
            url: "/addAuction",
            data: jsonData,
            processData: false,
            contentType: "application/json"
        })
            .done(function (data, success, response) {
                console.log(success);
                if (success !== "success") {
                    addAlert("alert", "alert-danger", "Errore nell'inserimento dell'asta.", "");
                } else {
                    addAlert("alert", "alert-success", "Asta inserita con successo!", "");
                    fetchOpenAuctions();
                }
            })
            .fail(function (response) {
                console.log(response);
            });
        $("#myModal").modal('toggle');
    });

    $("#clsModal").on("click", function () {
        $("#myModal").modal('toggle');
    });

    $("#openModalButton").on("click", function () {
        $("#myModal").modal('toggle');
    });
});

function fetchOpenAuctions() {
    $("#cont_aste").html("");
    
    $.ajax({
        type: "POST",
        url: "/getAllAuctions"
    }).done(function (data, success, response) {
        console.log(data);
        console.log(success);
        console.log(response);
        if (Array.isArray(data)) {
            data.forEach((auction) => {
                addAuction(auction);
            });
        } else {
            $("#cont_aste").append("<p>Nessuna asta aperta!</p>");
        }
    }).fail(function (response) {
        console.log(response);
    });
}

function addAuction(auction) {
    let html = `
                <div class="card mb-3">
                <div class="card-body">
                <div class="row">
                <div class="col-md-8">
                <h2 class="card-title fw-bold">Asta per ${auction.objName}</h2>
                </div>
                <div class="col-md-4 text-end">
                <p class="fw-bold">Offerta corrente: ${auction.highestBidValue ?? auction.startingPrice}€</p>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-12 text-end">
                        <button id="info${auction.auctionId}" class="btn btn-primary">Dettagli</button>
                    </div>
                </div>
            </div>
        </div>
        `;
    $("#cont_aste").append(html);
    document.getElementById("info" + auction.auctionId).addEventListener("click", function () {
        window.location.href = "/auction?id=" + auction.auctionId;
    });
}