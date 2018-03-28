const width = screen.width;
const height = screen.height;

class BayerImage {
    /**
     * @param {String} id The id of the canvas
     * @param {String} url The path of the image.
     */
    constructor(id, url) {
        // Start with a 5px pixel size.
        this.BAYER_PIXEL_SIZE = 5;

        this.id = id;
        this.url = url;
        let ctx = document.getElementById(id);
        this.ctx = ctx.getContext('2d');
    }

    /**
     * Allow us to extract the individual pixel indicies out of the large array of Uint8 values.
     *
     * @param {Number} x
     * @param {Number} y
     * @param {Number} width
     *
     * @return array [r index, g index, b index, a index]
     */
    getColorIndicesForCoord(x, y, width) {
        const red = y * (width * 4) + x * 4;

        return [red, red + 1, red + 2, red + 3];
    }

    /**
     * Using the color indicies, extract an individual pixel's data.
     * @param {Number} x
     * @param {Number} y
     * @param {ImageData} imageData
     *
     * @return array [r, g, b, a]
     */
    getRGBAFromCoord(x, y, imageData) {
        imageData = imageData || this.imageData;

        const colorIndex = this.getColorIndicesForCoord(x, y, imageData.width);
        return [
            imageData.data[colorIndex[0]],
            imageData.data[colorIndex[1]],
            imageData.data[colorIndex[2]],
            imageData.data[colorIndex[3]]
        ];
    }

    /**
     * Sets an individual's pixels to the values we want.
     *
     * @param {Number} x
     * @param {Number} y
     * @param {Array} rgba [r,g,b,a]
     * @param {ImageData} imageData
     */
    setRGBA(x, y, rgba, imageData) {
        imageData = imageData || this.imageData;

        const colorIndex = this.getColorIndicesForCoord(x, y, imageData.width);

        imageData.data[colorIndex[0]] = rgba[0];
        imageData.data[colorIndex[1]] = rgba[1];
        imageData.data[colorIndex[2]] = rgba[2];
        imageData.data[colorIndex[3]] = rgba[3];

        return imageData;
    }

    /**
     * Draws the image.
     *
     * @param {Callback} callback
     */
    drawInitialImage(callback) {
        //Loading of the home test image - img1
        const img1 = new Image();

        //drawing of the test image - img1
        img1.onload = () => {
            //draw background image
            this.ctx.drawImage(img1, 0, 0, img1.width / 5, img1.height / 5);
            this.imageData = this.ctx.getImageData(0, 0, width, height);

            callback(this);
        };

        img1.src = 'test.jpg';
    }

    /**
     * Breaks the image into "Bayer" pixels in which it will take the characteristic rggb grid.
     * We'll need to group up the values of multiple pixels to get a RGB value.
     */
    calculateBayerPixelRepresentation() {
        if (!this.imageData) {
            return;
        }

        // Reduce the image into bayer pixels.
        for (let i = 0; i < this.imageData.width / this.BAYER_PIXEL_SIZE; i++) {
            for (let ii = 0; ii < this.imageData.height / this.BAYER_PIXEL_SIZE; ii++) {

            }
        }
    }

}

/**
 * Sets the width/height to the screen.
 */
function initCanvas() {
    $('#filter_canvas').attr("width",$(window).width());
    $('#filter_canvas').attr("height",$(window).height());
}

$(() => {
    initCanvas();

    const bayerImage = new BayerImage('filter_canvas', 'test.jpg');
    bayerImage.drawInitialImage((self) => {
        // Debugging so far.
        console.log(self.imageData);
        console.log(self.getRGBAFromCoord(0, 0, self.imageData));
        self.ctx.putImageData(self.setRGBA(0, 0, [0,0,0,0], self.imageData), 0, 0);
    });
});
