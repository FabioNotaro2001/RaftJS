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

