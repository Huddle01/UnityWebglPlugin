var selfVideoElement;

function callMergeStrings() {
    const str1 = 'Hello';
    const str2 = 'World';

    // Allocate memory for the strings
    const str1Ptr = Module._malloc(lengthBytesUTF8(str1) + 1);
    const str2Ptr = Module._malloc(lengthBytesUTF8(str2) + 1);

    // Copy the strings to the allocated memory
    stringToUTF8(str1, str1Ptr, lengthBytesUTF8(str1) + 1);
    stringToUTF8(str2, str2Ptr, lengthBytesUTF8(str2) + 1);

    // Call the mergeStrings function from MyLibrary.jslib
    const mergedStringPtr = Module.ccall(
        'SendMessageToUnity',      // Name of the function in the .jslib file
        'number',            // Return type (pointer to a string)
        ['number', 'number'], // Parameter types (pointers to char arrays)
        [str1Ptr, str2Ptr]    // Arguments passed to the function
    );

    // Read the merged string from the pointer
    const mergedString = Pointer_stringify(mergedStringPtr);
    console.log('Received merged string:', mergedString);

    // Free the allocated memory
    Module._free(str1Ptr);
    Module._free(str2Ptr);
    Module._free(mergedStringPtr);
}

// Define another function that calls callMergeStrings
function executeFunctions() {
    console.log('Executing functions...');
    callMergeStrings(); // Call the callMergeStrings function
    console.log('Functions executed.');
}

// Set up a main function to be called when the module is ready
if (typeof Module !== 'undefined' && Module['calledRun']) {
    Module['calledMain'] = false;
    Module['run'] = function() {
        if (!Module['calledMain']) {
            executeFunctions(); // Call the executeFunctions function
            Module['calledMain'] = true;
        }
        if (!Module['calledMain']) console.log('ERROR: callMain() function was not called!');
    };
}

function createVideoElement(id) {
    // Create a new video element
    var videoElement = document.createElement('video');
    videoElement.id = id; // Set the ID of the video element
    videoElement.controls = true; // Enable video controls (e.g., play, pause)

    // Optionally, set other attributes or styles for the video element
     videoElement.width = 1280;
     videoElement.height = 720;

    // Append the video element to the document body (or another parent element)
    document.body.appendChild(videoElement);
    selfVideoElement = videoElement;
    startCameraAndRender(videoElement);
}

// Function to retrieve a video element by its ID
function getVideoElement(id) {
    // Find the video element with the specified ID
    console.log("element to find " + id);
    var videoElement = document.getElementById(id);
    return selfVideoElement;
}

function OnPeerAdded(peerInfo)
{
    //Need to call .jslib OnPeerAdded here
}




function startCameraAndRender(videoElement) {
    // Check if the browser supports getUserMedia
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        // Access the user's camera
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(function(stream) {
                // Set the video stream as the source of the video element
                videoElement.srcObject = stream;
            })
            .catch(function(error) {
                console.error('Error accessing camera:', error);
            });
    } else {
        console.error('getUserMedia is not supported in this browser');
    }
}


