var plotwin = new Window("Plot");
plotwin.content.id = 'plot';
plotwin.hide();  
plotwin.on("resize_stop", plot_refresh);
plotwin.on("change_state", function(){
    setTimeout(plot_refresh, 200);
})

function text_to_data(text) {
    lines = text.split('\n');
    for (var i = 0; i < lines.length; i++) {
        lines[i] = lines[i].trim().split(' ');
    }
    return lines;
}

function plot_lines_find_end(lines) {
    var start = 1; // first line is title
    var end = lines.length - 1;
    while (start + 1 < end) {
        var mid = parseInt((start + end) / 2)
        if (isNaN(parseFloat(lines[mid][0]))) {
            end = mid;
        } else {
            start = mid;
        }
    }
    return start;
}

function transpose(array) {
    return array[0].map((_, colIndex) => array.map(row => parseFloat(row[colIndex])));
}

function plot_refresh() {
    var data = [];
    var xlabel = 'index';
    try {
        var plot_raw_list = serial.getValue().split('startplot:').slice(1,);
        var plot_raw_text = plot_raw_list.at(-1);
        var plot_raw_lines = text_to_data(plot_raw_text);
        var plot_labels = plot_raw_lines[0];
        var plot_data_lines = plot_raw_lines.slice(1, plot_lines_find_end(plot_raw_lines) + 1);
        var plot_data = transpose(plot_data_lines);

        if (document.getElementById("x-axis").checked & plot_labels.length > 1) {
            xlabel = plot_labels[0];
            for (var i = 1; i < plot_labels.length; i++) {
                var curve = {};
                curve['x'] = plot_data[0];
                curve['y'] = plot_data[i];
                curve['name'] = plot_labels[i];
                curve['type'] = 'scatter';
                data.push(curve);
            }
        } else {
            for (var i = 0; i < plot_labels.length; i++) {
                var curve = {};
                curve['x'] = i;
                curve['y'] = plot_data[i];
                curve['name'] = plot_labels[i];
                curve['type'] = 'scatter';
                data.push(curve);
            }
        }
    } catch (e) { 
        console.error("Exception thrown", e.stack);
    }
    var layout = {
        showlegend: true,
        xaxis: {
            title: xlabel,
        },
    };
    Plotly.newPlot('plot', data, layout);
}

function plot_main() {
    plotwin.show();
    plot_refresh();
}

console.log("plot.js is loaded")

function load_plot_example () {
command.setValue(`"""
CircuitPython Online IDE plot example
please check and uncheck the [x-axis] box to see the difference.
"""
import math
from time import sleep
from time import monotonic as time

time_start = time()
# 'startplot:' is the start indicator
# column names separated by `,` in `print()`, no space in names.
print('startplot:', 't*cos(t)', 't*sin(t)')
for i in range(100):
    sleep(0.1)
    t = time() - time_start
    # print the data for plotting
    # column separated by `,` in `print()`
    print(t*math.cos(t), t*math.sin(t))
`, 1);
}
