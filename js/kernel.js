var K = function(renderCanvas, mapCanvas, depth, levelOfDetails) {
    this.renderCanvas = renderCanvas;
    this.renderCtx = renderCanvas.getContext('2d');
    this.mapCanvas = mapCanvas;
    this.mapCtx = mapCanvas.getContext('2d');
    this.depth = depth;
    this.level = levelOfDetails || 2;
};

K.prototype = {
    render: function() {
        var height = this.mapCanvas.height;
        var width = this.mapCanvas.width;
        var mapData = this.mapCtx.getImageData(0, 0, width, height);

        //Create voxel octree
        var tree = new K.VoxelOctree({
            data: mapData.data,
            depth: this.depth,
            width: width,
            height: height,
            level: this.level,
            map: this.mapCtx,
            render: this.renderCtx
        });
        tree.generate();
        console.log(tree.tree);
    },
    loadMap: function(image) {
        this.mapCtx.drawImage(image, 0, 0);
    }
};

K.VoxelOctree = function(settings) {
    this.s = settings;
    this.tree = {};
};

K.VoxelOctree.prototype = {
    generate: function(xs, ys, zs, xe, ye, ze, level, tree) {
        xs = xs || 0;
        ys = ys || 0;
        zs = zs || 0;
        xe = xe || this.s.width;
        ye = ye || this.s.height;
        ze = ze || this.s.depth;
        level = level || 0;
        tree = tree || this.tree;
        for (var x = 0; x < 2; x++) {
            for (var y = 0; y < 2; y++) {
                for (var z = 0; z < 2; z++) {
                    var halfX = Math.round(xe / 2);
                    var halfY = Math.round(ye / 2);
                    var halfZ = Math.round(ze / 2);
                    var cubeXStart = xs + x * halfX;
                    var cubeXEnd = cubeXStart + halfX - 1;
                    var cubeYStart = ys + y * halfY;
                    var cubeYEnd = cubeYStart + halfY - 1;
                    var cubeZStart = zs + z * halfZ;
                    var cubeZEnd = cubeZStart + halfZ - 1;
                    
//                    if(cubeXStart === this.s.width || cubeYStart === this.s.height || cubeZStart === this.s.depth){
//                        continue;
//                    }
                    
                    var treeKey = x + "-" + y + "-" + z;
                    tree[treeKey] = {};
                    var isEmptyBlock = this._evaluateBlock(cubeXStart, cubeYStart, cubeZStart, cubeXEnd, cubeYEnd, cubeZEnd);
                    
                    var factor = 2*level+4;
                    this.s.render.rect(cubeXStart+factor, cubeYStart+factor, halfX-factor, halfY-factor);
                    if (isEmptyBlock === -1 && level < this.s.level) {
                        this.s.render.strokeStyle = "blue";
                        this.generate(cubeXStart, cubeYStart, cubeZStart, cubeXEnd, cubeYEnd, cubeZEnd, level + 1, tree[treeKey]);
                    } else {
                        if(isEmptyBlock){
                            this.s.render.strokeStyle = "green";
                        } else {
                            this.s.render.strokeStyle = "red";
                        }
                        tree[treeKey] = isEmptyBlock;
                    }
                    var bgcolor = Math.round(255/(level*2));
                    this.s.render.lineWidth = 1;
                    this.s.render.fillStyle = "#"+bgcolor.toString(16)+bgcolor.toString(16)+bgcolor.toString(16);
                    this.s.render.fill();
                    this.s.render.stroke();
                }
            }
        }
    },
    _getDepth: function(r, g, b, zs, ze) {
        return Math.round(((r + g + b) / 3) / 255) * this.s.depth;
    },
    _evaluateBlock: function(xs, ys, zs, xe, ye, ze) {
        var shiftYS = ys === 0 ? 0 : (ys-1)*this.s.width;
        var shiftYE = ye === 0 ? 0 : (ye-1)*this.s.width;
        
        var start = (shiftYS + xs) * 4;
        var end = (shiftYE + xe) * 4;
        var nextRow = (this.s.width - xe + xs) * 4;
        
        var lastPixel;
        var firstIteration = true;
        for (var i = start; i < end; i += 4) {
            
            if ((i/4) % this.s.width === xe) {
                i += nextRow;
                continue;
            }
            var depth = this._getDepth(this.s.data[i], this.s.data[i + 1], this.s.data[i + 2]);
            
            for (var z = zs; z < ze; z++) {
                var isEmpty = depth === 0 || depth < z;
                if (!firstIteration && isEmpty !== lastPixel) {
                    return -1;
                }
                lastPixel = isEmpty;
                firstIteration = false;
            }
        }
        return lastPixel;
    }
};
