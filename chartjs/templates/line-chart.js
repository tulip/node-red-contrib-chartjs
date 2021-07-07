document.addEventListener("DOMContentLoaded", function (event) {
  // resize canvas to screen
  function resizeCanvas() {
    $("#container").css({
      height: window.innerHeight - $("#toolbar").outerHeight(),
      width: window.innerWidth,
    });
  }

  $(window).resize(function () {
    resizeCanvas();
  });

  resizeCanvas();

  // implement message topic event
  const topic = window.location.pathname.replace("/", "");

  // connect to socket.io server
  const socket = io.connect(window.location.origin, {
    query: "topic=" + topic,
  });

  socket.on(topic, function (red) {
    console.log(red);

    // update chart configuration
    if (red.config !== undefined) {
      defaultOptions.plugins.title.text = red.config.title;
      defaultOptions.scales.x.title.text = red.config.xaxis;
      defaultOptions.scales.y.title.text = red.config.yaxis;
    }

    if (red.options !== undefined) {
      try {
        let new_options = red.options;
        let mergedOptions = _.merge(defaultOptions, new_options);
        config.options = mergedOptions;
      } catch (err) {
        console.log("Error parsing other options for chart:", err);
      }
    }

    // update chart dataset
    if (red.payload !== undefined) {
      if (!Array.isArray(red.payload)) {
        const payload = [];
        payload.push(red.payload);

        red.payload = payload;
      }

      // initialize graph labels datasets
      // NOTES: the several series must have the same x axis distribution
      // get the first serial x axis
      chart.config.data.labels = [];

      red.payload[0].dataset.forEach((item) => {
        chart.config.data.labels.push(item.x);
      });

      chart.config.data.datasets = [];

      red.payload.forEach((serie, i) => {
        const dataset = {
          label: serie.channel,
          backgroundColor: serie.color,
          borderColor: serie.color,
          data: [],
          fill: false,
        };

        serie.dataset.forEach((item) => {
          dataset.data.push(item.y);
        });

        chart.config.data.datasets.push(dataset);
      });
    }

    console.log(config);

    // refresh chart
    chart.update();
  });

  // export event
  $(".dropdown-menu").on("click", "a", function (event) {
    // set a new white canvas to be exported
    destinationCanvas = document.createElement("canvas");
    destinationCanvas.width = canvas.width;
    destinationCanvas.height = canvas.height;

    const ctx = destinationCanvas.getContext("2d");
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(canvas, 0, 0);

    const canvasImg = destinationCanvas.toDataURL("image/png", 1.0);

    // export to image or pdf file
    if (event.target.id == "image") {
      const link = document.createElement("a");

      link.download = "image";
      link.href = canvasImg;
      link.click();
    } else {
      const doc = new jsPDF("landscape");

      doc.addImage(canvasImg, "JPEG", 10, 10, 280, 110);
      doc.save("canvas.pdf");
    }
  });

  // get canvas chart
  const canvas = document.getElementById("chart");
  const ctx = canvas.getContext("2d");

  const defaultOptions = {
    responsive: true,
    animation: false,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: "Line Chart",
      },
    },
    tooltips: {
      mode: "index",
      intersect: false,
    },
    hover: {
      mode: "nearest",
      intersect: true,
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: "Item",
        },
        type: "linear",
      },
      y: {
        display: true,
        title: {
          display: true,
          text: "Value",
        },
      },
    },
  };

  // configure chart
  const config = {
    type: "line",
    data: {
      labels: [],
      datasets: [],
    },
    options: defaultOptions,
  };

  // define global Chart Options and create chart
  Chart.defaults.defaultFontColor = "grey";
  Chart.defaults.defaultFontSize = 16;

  let chart = new Chart(ctx, config);
});
