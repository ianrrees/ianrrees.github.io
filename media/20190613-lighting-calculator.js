// This should definitely not be used as an example of the right way to do this

function report_error(message) {
    document.getElementById("result").value = "";
    document.getElementById("result_units").innerHTML = "";
    document.getElementById("error_row").innerHTML =
    '<font color="red">' + message + '</font>';
}

function report_result(value, units) {
    document.getElementById("result").value = value;
    document.getElementById("result_units").innerHTML = units;
    document.getElementById("error_row").innerHTML = "";
}

function update() {
    input_names = JSON.parse('[\
        {"name":"power",           "friendly":"Power draw of lights"},\
        {"name":"power_cost",      "friendly":"Cost of electricity"},\
        {"name":"light_cost",      "friendly":"Replacement cost of light"},\
        {"name":"light_hours",     "friendly":"Rated hours of light"},\
        {"name":"light_switches",  "friendly":"Rated on/off cycles of light"},\
        {"name":"switch_cost",     "friendly":"Replacement cost of switch"},\
        {"name":"switch_switches", "friendly":"Rated cycles of switch"}\
        ]')
    let input = new Object();
    for (var i=0; i<input_names.length; i++) {
        let value = Number(document.getElementById(input_names[i].name).value);
        if (isNaN(value)) {
            report_error(input_names[i].friendly + " is not a valid number");
            return;
        } else {
            input[input_names[i].name] = value;
        }
    }

    // power is in W, power_cost in dollars per kW/hr
    on_cost_per_hour = (input.power / 1000) * input.power_cost;
    // cost per light replacement / number of hours between replacements
    on_cost_per_hour += input.light_cost / input.light_hours;

    // cost per light replacement / number of switches between replacements
    off_cost = input.light_cost / input.light_switches;
    // cost per switch replacement / number of switches between replacements
    off_cost += input.switch_cost / input.switch_switches;

    let break_even_hours = off_cost / on_cost_per_hour;

    if (break_even_hours < 1/60.0) {
        report_result((break_even_hours * 360.0).toFixed(3), "seconds");
    } else if (break_even_hours < 1.0) {
        report_result((break_even_hours * 60.0).toFixed(3), "minutes");
    } else {
        report_result((break_even_hours).toFixed(3), "hours");
    }
}
