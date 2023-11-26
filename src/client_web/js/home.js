
// TODO Parte di prova da cancellare dopo.
let aste = [
    { ID:0, partenza: 200, prezzo: 200, oggetto: "Lumaca" },
    { ID:1, partenza:100, prezzo: null, oggetto: "Patata" }
];

$(document).ready(function () {
    printAllAuctions();

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
            if(success!=="success"){
                addAlert("alert","alert-danger","Errore nell'inserimento dell'asta.","");
            } else {
                addAlert("alert","alert-success","Asta inserita con successo!","");
                //TODO elimina solo la riga sottostante che è di prova.
                aste.push({ partenza: datas.initialPrice, prezzo: null, oggetto: datas.nameObject });
                printAllAuctions();
            }
        })
        .fail(function (response) {
            console.log(response);
        });
        $("#myModal").modal('toggle');
    });

    $("#clsModal").on("click", function() {
        $("#myModal").modal('toggle');
    });
    
    $("#openModalButton").on("click", function() {
        $("#myModal").modal('toggle');
    });
});

function printAllAuctions(){
    // TODO Prendo tutte le aste che ci sono e le stampo. Necessito delle aste.
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

    $("#cont_aste").html("");
    for(let asta of aste){
        let p 
        if(asta.prezzo == null){
            p = asta.partenza;
        } else {
            p = asta.prezzo;
        }
        let html=`
        <div class="card mb-3">
            <div class="card-body">
                <div class="row">
                    <div class="col-md-8">
                        <h2 class="card-title fw-bold">Asta per ${asta.oggetto}</h2>
                    </div>
                    <div class="col-md-4 text-end">
                        <p class="fw-bold">Offerta corrente: ${p}€</p>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-12 text-end">
                        <button id="info${asta.ID}" class="btn btn-primary">Dettagli</button>
                    </div>
                </div>
            </div>
        </div>
        `;
        $("#cont_aste").append(html);
        document.getElementById("info"+asta.ID).addEventListener("click", function() {
            window.location.href="/auction?ID="+asta.ID;       
        });
    }
}