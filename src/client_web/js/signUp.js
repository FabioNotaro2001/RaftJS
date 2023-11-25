
$(document).ready(function () {
    $("form").submit(function (event) {
        event.preventDefault();
        const datas = getFormData("form_sign");

        // Converti l'oggetto in una stringa JSON
        const jsonData = JSON.stringify(datas);

        $.ajax({
            type: "POST",
            url: "/createuser",
            data: jsonData,
            processData: false,
            contentType: "application/json"
        })
        .done(function (data, success, response) {
            if(success!=="success"){
                addAlert("alert","alert-danger","Errore nell'iscrizione.","");
            } else {
                window.location.href="/login";
            }
        })
        .fail(function (response) {
            console.log(response);
        });
    });
});

