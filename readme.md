# Tracker tool by VivaLab

## Configuration of the software
1) Create a folder "data" at the root of the project. Put in a new folder your data, containing : 
    1) Image datasets 
    2) Customers infos  
  
  So it has to be like this :  
  * data/
    * your_folder_datasets
        * frames_folder
        * customers_folder
        
2) Execute : `python folder2json data/your_folder_datasets/frames_folder`
This will create a "data.json" 

3) Put in config/datasets.json the path to 'your_folder_datasets'

4) Then you can start using it


## Use the software

When you have successfully done the configuration, open the project in a web browser. 
Then select the folder you have configured in step 3. It'll load your frames.    
  
Once done, click on the canvas and it'll automatically play the frames and 
download .zip files each 700 frames. You can change this value in the program by changing the 'canvas_max'
var.  
  
If you don't want to record a moment of the video, please unselect "Recording".
