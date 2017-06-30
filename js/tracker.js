// global variables
var canvas;
var context          = null;
var image            = null;
var dataset          = {};
var frameIndex       = -1;
var setLoaded        = false;
var labelFont        = "18px Arial";
var width_drawing    = 4;
var arrow_space      = 5; //number of pixels between arrow and bounding box
var arrow_width      = 25;
var arrow_height     = 30;
var key              =  {'a': 65, 'c' : 67, 'd' : 68, 'e':69, 'p' : 80, 'z' : 90, 'r' : 82, 'left' : 37, 'right' : 39, 'space' : 32, 'u' : 85, 'up' : 38, 'down' : 40, 'w' : 87, 'x' : 88, 'enter' : 13, 'esc' : 27, '+' : 107, '-' : 109, 'pgup': 33, 'pgdn': 34, 'ctrl':17, 'shift':16};
var is_video_playing = false;
var interval = null;
var customers = [];
var nb_customers = 23;
var nb_cams = 2;
var canvas_recorded = [];
var calculing = false;
var recording = true;
var canvas_max = 700;
var index_zip = 0;
var path_customers_folder = "";

/**
 * object that represents a customer
 */
function Customer(){
    this.name = '';
    this.frame_and_region = [];
    this.region_displayed = null;
    this.index_region_displayed = 0;
    this.size = 0;
    this.time = 0;
    this.color = "";

    this.addFrame = function (id, region, camera){
        this.frame_and_region.push({
            'id'        : id,
            'region'    : region,
            'cam'       : camera
        });

    };

    this.getRegion = function(index_cam){
        if(this.region_displayed != null){
            return this.region_displayed.cam == index_cam ? this.region_displayed : null;
        } else {
            return null;
        }
    };

    this.update = function(id){
        // if person has gone and no region has to be printed anymore
        if(this.index_region_displayed < this.frame_and_region.length){
            // update time printed
            // just to be sure there are frame and region parametered
            if(this.frame_and_region[this.index_region_displayed].id == id){
                this.updateTime(id);
                // update region displayed
                this.region_displayed = this.frame_and_region[this.index_region_displayed].region;
                this.region_displayed['cam'] = this.frame_and_region[this.index_region_displayed].cam;
                //update index
                this.index_region_displayed++;
                // increment the counter of frames
            }
        } else {
            this.region_displayed = null;
        }
    };

    this.updateTime = function(id){ // get time in secondes
        if(this.region_displayed != null){
            this.time = (parseInt(id) - parseInt(this.frame_and_region[0].id))/1000;
        }
    }
} // end stateBox

/**
 * get a random int value between min & max
 */
function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min +1)) + min;
}

/**
 * inform users about #frames in the DB
 */
function refreshDatas(){
    // display the # of current frame
    $("#frames").html(sprintf("Frame: $d / $d",frameIndex+1,dataset.frames.length));
} // end refreshDatas

/**
 * show alert to user
 */
function showMessage(alert) {
    if(alert['type']){
        $('#alert').attr("class","alert alert-"+alert['type']);
        $('#alert').html(alert['message']);
    } else {
        $('#alert').attr("class","alert alert-info");
        $('#alert').html(alert);
    }
}

/**
 * display image
 */
function displayImage(){
    //get frame which index is indexFrame
    image.src =  dataset.url + dataset.frames[frameIndex].file;
    image.onload = function(){ //On attend que l'image soit chargée avant de passer à la suivante
        context.drawImage(image, 0, 0, canvas.width, canvas.height); // refresh image
        getAndPrintAllCustomersForCurrentImage();
        refreshDatas();
        calculing = false;
    };

} // end displayImage

/**
 *  Given a JSON object initialize annotation tool
 */
function initializeImgDataset(data){
    //get datas and ordre them by name asc
    frames = data.frames.sort(sortByNameFile);
    dataset = data;
    dataset.frames = frames;

    //initialize
    frameIndex     = 0;

    //get image size from JSON file to resize canvas
    canvas.width =  dataset.canvas[0];
    canvas.height = dataset.canvas[1];
    //change canvas size
    document.getElementById('canvas').setAttribute('width', canvas.width);
    document.getElementById('canvas').setAttribute('height', canvas.height);
    displayImage();
    showMessage({'type':'success', 'message':'Frames initialized'});
    setLoaded = true;
} // end initializeImgDataset

/**
 * sort frames array by name file
 */
function sortByNameFile(a ,b){
    var nameA = a.file.toLowerCase();
    var nameB = b.file.toLowerCase();
    return ((nameA < nameB) ? -1 : ((nameA > nameB) ? 1 : 0));
}

/**
 * display all the bounding boxes for current image
 */
function getAndPrintAllCustomersForCurrentImage(){
    //draw all customers
    var region;
    for(var i = 0; i < customers.length; i++){
        customers[i].update(dataset.frames[frameIndex].file.match(/[0-9]{13}/)[0]); // update if necessary region by taken file name before the .png
        region = customers[i].getRegion(0); // get if a region need to be displayed
        if(region != null){
            context.beginPath();
            context.font        = labelFont;
            context.textAlign   = "center";
            context.lineWidth   = width_drawing;
            context.strokeStyle = customers[i].color;
            context.fillStyle   = customers[i].color;

            //draw the arrow
            var x_middle = region.x + region.width/2 ;
            var y_middle = region.y - arrow_space;
            var x_top_left = x_middle - arrow_width;
            var x_top_right = x_middle + arrow_width;
            context.moveTo(x_middle, y_middle);
            context.lineTo(x_top_left, y_middle - arrow_height);
            context.moveTo(x_middle, y_middle);
            context.lineTo(x_top_right, y_middle - arrow_height);
            context.moveTo(x_top_right, y_middle - arrow_height);
            context.lineTo(x_top_left, y_middle - arrow_height);
            //end

            context.fillStyle   = "#FFF";
            context.fillRect(x_top_left, region.y - arrow_space - arrow_height, 2*arrow_width, -22);

            //display time
            var time_printed = "";
            var time = customers[i].time;
            var minutes = Math.floor(time / 60);
            var secondes = Math.floor(time) - minutes*60;
            minutes = minutes < 10 ? "0" + minutes.toString() : minutes.toString();
            secondes = secondes < 10 ? "0" + secondes.toString() : secondes.toString();
            time_printed = minutes + ":" + secondes;
            context.fillStyle   = customers[i].color;
            context.fillText(
                time_printed,
                x_middle,
                y_middle - arrow_height - arrow_space,
            );
            //end



            context.stroke();
            context.closePath();
        }

    }
} //end function getAndPrintAllCustomersForCurrentImage

/**
 * go on to next frame if previous image has been loaded
 */
function nextFrame(){
    if(dataset.frames[frameIndex].file){
        if(image.complete && !calculing){
            if(frameIndex <= dataset.frames.length){
                if(recording) {
                    canvas_recorded.push(canvas.toDataURL('image/jpeg', 1));
                    if(canvas_recorded.length >= canvas_max){
                        downloadCanvasRecorded();
                    }
                }
                frameIndex++;
                calculing = true;
                displayImage();
            }
        }
    }
}

/**
 * Create zip file from images array
 */
function createArchive(images){
    var zip = new JSZip();
    var img = zip.folder("images1");

    for (var i=0; i<images.length; i++) {
        var commaIdx = images[i].indexOf(",");
        img.file(i+index_zip*canvas_max+".jpg", images[i].slice(commaIdx + 1), {base64: true});
    }
    zip.generateAsync({type:"blob"}).then(function(file){
        saveAs(file, "images"+index_zip+".zip");
    });
    index_zip++;
    canvas_recorded = [];
    showMessage({'type':'success', 'message':'Zip created, download will start soon'});
}

/**
 *  get all canvas recorded and add them to a zip file
 */
function downloadCanvasRecorded(){
    showMessage("Creating Zip file of all frames recorded");
    var images = [];
    for(var i = 0; i < canvas_recorded.length; i++){
        images.push(canvas_recorded[i]);
    }
    createArchive(images);
}

/**
 * reads a JSON file containing datasets info, populate the drop-down list
 * with dataset names and the paths to the directory where the actual
 * set of images live.
 */
function loadDatasetsInfo(){
    // read json file
    $.getJSON(sprintf("./config/datasets.json?q=$f", Math.random()), function(data)
    {
        $('#select_folder').json2html(data, {'<>':'option','html':'${name}', 'value':'${url}'});

    });
}// end loadDatasetsInfo

/**
 * go on the customers folders to store all .json files
 */
function loadCustomersDatas(){
    if(path_customers_folder != ""){
        for(var i = 0; i < nb_customers; i++) {
            var name = i<10 ? "0"+i : i;
            try {
                $.getJSON('http://localhost/stage/tracker/data/' + path_customers_folder + '/simulator/customers/customer_000' + name + '.json', function (data) {
                    customer = new Customer();
                    customer.name = data.name;
                    customer.size = data.size[0];
                    customer.color = "rgb("+getRandomIntInclusive(0,200)+","+getRandomIntInclusive(0,200)+","+getRandomIntInclusive(0,200)+")";

                    var annotation;
                    // for all cams
                    for(var cam=0; cam < nb_cams; cam++){
                        for (var i = 0; i < data.clusters[cam][0].length; i++) {
                            annotation = data.clusters[cam][0][i];
                            customer.addFrame(
                                annotation.id.substr(0, 13),
                                annotation.head,
                                cam
                            );
                        }
                    }
                    customers.push(customer);
                });
            }
            catch (err) {

            }
        }
    }

}

/**
 * to get events that can occur on the web page
 */
function addListenersToDocument() {
    document.addEventListener('keydown', function (event) {
        // frame -= 50
        if (event.keyCode == key['pgdn']) {
            if (frameIndex > 50) {
                frameIndex = frameIndex - 50;
            } else {
                frameIndex = 0;
            }
            displayImage();
        }
        // frame += 50
        else if (event.keyCode == key['pgup']) {
            if (frameIndex < dataset.frames.length - 50) {
                frameIndex = frameIndex + 50;
            } else {
                frameIndex = dataset.frames.length - 1;
            }
            displayImage();
        }

        // speed of video
        else if(is_video_playing && event.keyCode == key['right']){
            clearInterval(interval);
            interval = setInterval(function () {
                nextFrame();
            }, 10);
        }
        else if(is_video_playing && event.keyCode == key['left']){
            clearInterval(interval);
            interval = setInterval(function () {
                nextFrame();
            }, 250);
        }
        else if(is_video_playing && event.keyCode == key['down']){
            clearInterval(interval);
            interval = setInterval(function () {
                nextFrame();
            }, 75);
        }
    });

    /**
     *  When a click happens on the button to download canvas generated
     */
    $("#download_frames").click(function(){
        downloadCanvasRecorded();
    });

    /**
     *  When we don't want to record some frames
     */
    $('#recorder').change(function(){
        if($(this).is(':checked')){
            recording = true;
        }
        else {
            recording = false;
        }
    });
}

/**
 * Load the information about the image set the user has selected
 */
function addListenerToSelects(){
    $('#select_folder').change( function () {
        var _url = $("#select_folder option:selected").val();
        path_customers_folder = $("#select_folder option:selected").text();
        loadCustomersDatas();

        if (_url != "" ){
            frameIndex = 0;
            $.getJSON(sprintf('$s?q=$f',_url, Math.random()), function(data) {
                initializeImgDataset(data);
            });
            $('#canvas').focus();
            $('#canvas').show();
            $('.annotation_type').show();
            $('.annotation_label').show();
        } else {
            frameIndex = -1;
            context.clearRect(0, 0, canvas.width, canvas.height);
            $('#canvas').hide();
            $('#details').hide();
            $('.annotation_type').hide();
            $('.annotation_label').hide();
        }
    });
} // loadImagesInformation

/**
 * Events click on canvas
 */
function addListenerToCanvas() {
    // click over canvas
    canvas.addEventListener('click', function (e) {
        is_video_playing = !is_video_playing;
        if (is_video_playing) {
            showMessage('Playing ...');
            interval = setInterval(function () {
                nextFrame();
            }, 65);
        }
        else {
            clearInterval(interval);
            showMessage('Pause');
        }
    });
}


/**
 * waits until the HTML is finished loading and then it runs the script
 */
$(document).ready(function(){
    canvas    = document.getElementById('canvas');  // select canvas element
    context   = canvas.getContext('2d');            // select context
    setLoaded = false;                              // flag indicating if the image set has been uploaded
    image = new Image();

    // load datasets names and populate the drop-down list
    loadDatasetsInfo();

    addListenerToSelects();
    addListenerToCanvas();
    addListenersToDocument();


    showMessage("Welcome on the Annotation Tool created by Viva Lab !");
}); // end ready function
   