$(document).ready(function () {
    // TODO Prendo tutte le aste che ci sono e le stampo. Necessito delle aste.
    const aste = [
        { partenza: 200, prezzo: 200, oggetto: "Lumaca" },
        { partenza:100, prezzo: null, oggetto: "Patata" }
    ];
    
    let html = '<h1>Elenco Aste</h1>';
    let n = 1;
    for(asta of aste){
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
    }
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

        // Converti l'oggetto in una stringa JSON
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

function addAlert(id_append,classe,message,time_remove)
{
    
    let alert = $('<div class="alert '+classe+'">' + '<button type="button" class="close" data-dismiss="alert" onClick="$(this).parent().remove()">' +
    '&times;</button>' + message + '</div>');

    if(time_remove=='x')
        setTimeout(function () { alert.remove(); }, 5000);
    else if(time_remove!='' && time_remove!=undefined)
        setTimeout(function () { alert.remove(); }, time_remove);

    $('#'+id_append).html(alert);
}

function getFormData(id_form) {
    const formData = {};

    if ($("#" + id_form).is("form")) {
        let form = $("#" + id_form);
        let unindexed_array = form.serializeArray();
        unindexed_array.forEach(element => {
            formData[element.name] = element.value;
        });
    }
    return formData;
}