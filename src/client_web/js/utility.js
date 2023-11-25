/**
 * Add an allert on the page.
 * @param {Number} id_append Id section.
 * @param {String} classe Type of allert.
 * @param {String} message Message of allert.
 * @param {Number} time_remove Time to remove the alert.
 */
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

/**
 * Take the datas from the form.
 * @param {Number} id_form Id of the form. 
 * @returns A Formdata that contains all the datas.
 */
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