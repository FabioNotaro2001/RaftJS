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
