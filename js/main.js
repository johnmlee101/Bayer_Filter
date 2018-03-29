const width = screen.width;
const height = screen.height;

class BayerImage {
    /**
     * @param {String} id The id of the canvas
     * @param {String} url The path of the image.
     */
    constructor(id, url) {
        // Start with a 5px pixel size.
        this.BAYER_PIXEL_SIZE = 1;

        this.id = id;
        this.url = url;
        let ctx = document.getElementById(id);
        this.ctx = ctx.getContext('2d');

        this.imgWidth = width / 4;
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
        width = width || this.imageData.width;
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
     *
     * @param {Number} x
     * @param {Number} y
     * @param {Number} width
     * @param {Number} colorIndex
     * @param {Number} colorValue
     * @param {ImageData} imageData
     */
    drawSquare(x, y, width, colorIndex, colorValue, imageData) {
        for (let i = y; i < y + width; i++) {
            for (let ii = x; ii < x + width; ii++) {
                const colorIndicies = this.getColorIndicesForCoord(ii, i, imageData.width);
                imageData.data[colorIndicies[0]] = colorIndex === 0 ? colorValue : 0;
                imageData.data[colorIndicies[1]] = colorIndex === 1 ? colorValue : 0;
                imageData.data[colorIndicies[2]] = colorIndex === 2 ? colorValue : 0;
                imageData.data[colorIndicies[3]] = 255;
            }
        }

        return imageData;
    }

    /**
     * Returns the average values of a certain color in a square range.
     * Uses a cumulative average.
     *
     * @param {Number} x Starting position (Left)
     * @param {Number} y Starting position (Top)
     * @param {Number} width
     * @param {Number} colorIndex R,G,B,A => 0,1,2,3
     */
    averageOfSquare(x, y, width, colorIndex) {
        let cumulativeAverage = 0;
        let n = 0;
        for (let i = y; i < y + width; i++) {
            for (let ii = x; ii < x + width; ii++) {
                const value = this.imageData.data[this.getColorIndicesForCoord(ii, i)[colorIndex]];
                cumulativeAverage += (value - cumulativeAverage) / (n + 1);
                n++;
            }
        }

        return cumulativeAverage;
    }

    /**
     * Draws the image.
     *
     * @param {Callback} callback
     */
    drawInitialImage(callback) {
        const img1 = new Image();

        img1.onload = () => {
            // The width should match the screen size / 4. Adjust the ratios to match.
            this.imgHeight = this.imgWidth * (img1.height / img1.width);
            this.ctx.drawImage(img1, 0, 0, this.imgWidth, this.imgHeight);
            this.imageData = this.ctx.getImageData(0, 0, width, height);

            callback(this);
        };

        img1.src = 'test.jpg';
    }

    /**
     * Get the bayer color grid representation.
     * Row 1 alternates B G
     * Row 2 alternates G R
     *
     * @param {Number} x
     * @param {Number} y
     *
     * @returns {Number} ColorIndex
     */
    getBayerColorAtLocation(x, y) {
        // First row.
        if (y % 2) {
            return x % 2 ? 2 : 1;
        }

        return x % 2 ? 1 : 0;
    }

    /**
     * Breaks the image into "Bayer" pixels in which it will take the characteristic rggb grid.
     * We'll need to group up the values of multiple pixels to get a RGB value.
     */
    calculateBayerPixelRepresentation() {
        if (!this.imageData) {
            return;
        }

        const bayerArray = [];

        // Reduce the image into bayer pixels.
        for (let i = 0; i < this.imageData.height / this.BAYER_PIXEL_SIZE; i++) {
            bayerArray[i] = [];
            for (let ii = 0; ii < this.imageData.width / this.BAYER_PIXEL_SIZE; ii++) {
                const gridColor = this.getBayerColorAtLocation(ii, i);
                bayerArray[i][ii] = this.averageOfSquare(
                    ii * this.BAYER_PIXEL_SIZE,
                    i * this.BAYER_PIXEL_SIZE,
                    this.BAYER_PIXEL_SIZE,
                    gridColor
                );

                // Draw this in the second image slot.
                this.drawSquare(ii * this.BAYER_PIXEL_SIZE, i * this.BAYER_PIXEL_SIZE, this.BAYER_PIXEL_SIZE, gridColor, bayerArray[i][ii], this.imageData)
            }
        }

        this.ctx.putImageData(this.imageData, 0, 0);

        console.log(bayerArray);
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
        self.calculateBayerPixelRepresentation();
    });
});
