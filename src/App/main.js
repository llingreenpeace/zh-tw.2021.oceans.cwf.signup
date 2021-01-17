import './main.scss'
const ProgressBar = require('progressbar.js')
const {$, dataLayer, currency} = window


$(document).ready(function() {
    console.log( "ready!" );
    initProgressBar();
    createYearOptions()
    initForm();
    init();
});

async function initProgressBar() {

    const goal = 20000;
    $('#petition-goal').html(currency(goal, { precision: 0, separator: ',' }).format());

    let count = 2737;
    try {
        let response = await fetch('https://act.greenpeace.org/page/widget/713556');
        let res = await response.json();
        count = res.data.rows.map((item) => {return parseInt(item.columns[4].value)}).reduce((a, b) => {return a + b}, 0);
        $('#petition-count').html(currency(count, { precision: 0, separator: ',' }).format());

    } catch (err) {
        console.log(err);
    }
    let percent = count / goal;

    let bar = new ProgressBar.Line('#progress-bar', {
        strokeWidth: 3,
        easing: 'easeInOut',
        duration: 1400,
        color: '#FFEA82',
        trailColor: '#eee',
        trailWidth: 1,
        svgStyle: {width: '100%', height: '100%'}
    });
    // console.log(percent)
    bar.animate(percent);
}

function createYearOptions() {
    let currYear = new Date().getFullYear()
    $("#fake_supporter_birthYear").append(`<option value="">出生年份</option>`);
    for (var i = 0; i < 80; i++) {
        let option = `<option value="01/01/${currYear-i}">${currYear-i}</option>`

        $("#fake_supporter_birthYear").append(option);
        $('#en__field_supporter_NOT_TAGGED_6').append(option);
    }
}

const resolveEnPagePetitionStatus = () => {
	let status = "FRESH";
	// console.log(window);
	if (window.pageJson.pageNumber === 2) {
		status = "SUCC"; // succ page
	} else {
		status = "FRESH"; // start page
	}

	return status;
};

const initForm = () => {
    console.log('init form')

    $('#center_sign-submit').click(function(e){
        e.preventDefault();
        $("#fake-form").submit();
        console.log("fake-form submitting")
    }).end()

    $.validator.addMethod( //override email with django email validator regex - fringe cases: "user@admin.state.in..us" or "name@website.a"
        'email',
        function(value, element){
            return this.optional(element) || /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/i.test(value);
        },
        'Email 格式錯誤'
    );

    $.validator.addMethod(
        "taiwan-phone",
        function (value, element) {
            
            // const phoneReg1 = new RegExp(/0\d{1,2}-\d{6,8}$/).test(value);
            // const phoneReg2 = new RegExp(/0\d{1,2}\d{6,8}$/).test(value);
            // const phoneReg3 = new RegExp(/((?=(09))[0-9]{10})$/).test(value);
            // const phoneReg4 = new RegExp(/(886\d{1,2}\d{6,8})$/).test(value);
            // const phoneReg5 = new RegExp(/(886\d{1,2}-\d{7,9})$/).test(value);

            const phoneReg6 = new RegExp(/^(0|886|\+886)?(9\d{8})$/).test(value);
			const phoneReg7 = new RegExp(/^(0|886|\+886){1}[2-8]-?\d{6,8}$/).test(value);

            if ($('#fake_supporter_phone').val()) {
                return (phoneReg6 || phoneReg7)
            }
            console.log('phone testing')
            return true
        },
        "電話格式不正確，請只輸入數字 0912345678 和 02-23612351")

    $.validator.addClassRules({ // connect it to a css class
        "email": {email: true},
        "taiwan-phone" : { "taiwan-phone" : true }
    });

    $("#fake-form").validate({
        errorPlacement: function(error, element) {
            console.log(error)
            element.parents("div.form-field:first").after( error );
        },
        submitHandler: function(form) {
            
            $('#en__field_supporter_firstName').val($('#fake_supporter_firstName').val());
            $('#en__field_supporter_lastName').val($('#fake_supporter_lastName').val());
            $('#en__field_supporter_emailAddress').val($('#fake_supporter_emailAddress').val());
    
            if (!$('#fake_supporter_phone').prop('required') && !$('#fake_supporter_phone').val()) {
                $('#en__field_supporter_phoneNumber').val('0900000000');
            } else {
                $('#en__field_supporter_phoneNumber').val($('#fake_supporter_phone').val());
            }
            $('#en__field_supporter_NOT_TAGGED_6').val($('#fake_supporter_birthYear').val());
            $('#en__field_supporter_questions_7276').val(($('#fake_optin').prop("checked") ? "Y": "N"));
            
            console.log('en form submit')
            // console.log($('form.en__component--page').serialize())
            
            $("form.en__component--page").submit();
        },
        invalidHandler: function(event, validator) {
            // 'this' refers to the form
            var errors = validator.numberOfInvalids();
            if (errors) {
                console.log(errors)
                var message = errors == 1
                    ? 'You missed 1 field. It has been highlighted'
                    : 'You missed ' + errors + ' fields. They have been highlighted';
                $("div.error").show();
            } else {
                $("div.error").hide();
            }
        }
    });
}

function init () {
    
    const EN_PAGE_STATUS = resolveEnPagePetitionStatus()
	// console.log("EN_PAGE_STATUS", EN_PAGE_STATUS)
	if (EN_PAGE_STATUS==="FRESH") {
    
        $(".page-2").hide();

	} else if (EN_PAGE_STATUS==="SUCC") {
        
        $('.page-1').hide();
        $('.page-2').show();
        $("section").hide();
        $("#home").show();
	}
}
