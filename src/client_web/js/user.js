$(document).ready(function () {
    let userCookie = document.cookie.split("user=")[1];

    loadUserAuctions(userCookie);
    loadParticipations(userCookie);

    $("#logout").on("click", function() {
        $.ajax({
            type: "POST",
            url: "/logoutuser",
            data: {},
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

function loadUserAuctions(user){
    $.ajax({
        type: "POST",
        url: "/getUserAuctions",
        data: JSON.stringify({user: user}),
        processData: false,
        contentType: "application/json"
    })
    .done(function (data, success, response) {
        let html = '';

        for (const auction of data) {
            html+=`
            <tr>
                <td scope="col">${auction.objName}</th>
                <td scope="col">${auction.openingDate.toLocaleString()}</th>
                <td scope="col">${auction.closingDate ? auction.closingDate.toLocaleString() : "Asta aperta"}</th>
                <td scope="col">${auction.startingPrice}</th>
                <td scope="col">${auction.highestBidValue ?? ""}</th>
            </tr>
            `;
        }
        $("#my_ast").html(html);
    })
    .fail(function (response) {
        console.log(response);
    });

}

function loadParticipations(user){    
    $.ajax({
        type: "POST",
        url: "/getUserParticipations",
        data: JSON.stringify({user: user}),
        processData: false,
        contentType: "application/json"
    })
    .done(function (data, success, response) {
        let html = '';

        for (const auction of data) {
            html+=`
            <tr>
                <td scope="col">${auction.objName}</th>
                <td scope="col">${auction.openingDate.toLocaleString()}</th>
                <td scope="col">${auction.closingDate ? auction.closingDate.toLocaleString() : "Asta aperta"}</th>
                <td scope="col">${auction.startingPrice}</th>
                <td scope="col">${auction.highestBidValue ?? ""}</th>
            </tr>
            `;
        }
        $("#my_part").html(html);
    })
    .fail(function (response) {
        console.log(response);
    });
}