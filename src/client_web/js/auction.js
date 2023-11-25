$(document).ready(function () {
    // TODO Prendo l'asta col relativo id.
    const asta = { partenza: 200, prezzo: 200, oggetto: "Lumaca" };
    
    let html = '';
    let p 
    if(asta.prezzo == null){
        p = asta.partenza;
    } else {
        p = asta.prezzo;
    }
    html+=`
    <div class="card mb-3">
        <div class="card-body">
            <div class="row">
                <div class="col-md-8">
                    <h2 class="card-title fw-bold">Asta ${n}</h2>
                    <p class="card-text">Articolo: ${asta.oggetto}</p>
                </div>
                <div class="col-md-4 text-end">
                    <p class="fw-bold">Offerta corrente: ${p}€</p>
                </div>
            </div>
            <div class="row">
                <div class="col-md-12 text-end">
                    <button class="btn btn-primary" onclick="">Dettagli</button>
                </div>
            </div>
        </div>
    </div>
    `;
    n++;

    $("#cont_aste").html(html);

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
        const datas = getFormData("form_login");
        const jsonData = JSON.stringify(datas);

        $.ajax({
            type: "POST",
            url: "/loginuser",
            data: jsonData,
            processData: false,
            contentType: "application/json"
        })
        .done(function (data, success, response) {
            console.log(success);
            if(success!=="success"){
                addAlert("alert","alert-danger","Errore nella login.","");
            } else {
                window.location.href="/home";
            }
        })
        .fail(function (response) {
            console.log(response);
        });
    });
});