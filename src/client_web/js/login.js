$(document).ready(function () {
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
            window.location.href="/home";
        })
        .fail(function (response) {
            addAlert("alert","alert-danger","Errore nella login.","");
            console.log(response);
        });
    });
});

