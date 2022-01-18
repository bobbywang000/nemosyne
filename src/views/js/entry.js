$(document).ready(function () {
    $('#subjectDate').on('change', function () {
        var date = $('input[name=subjectDate]').val();
        $.ajax({
            type: 'get',
            url: `/impressions/ajax/${date}`,
            dataType: 'json',
        }).done(function (data) {
            $('#negativity').val(data.negativity);
            $('#positivity').val(data.positivity);
        });
    });
});
