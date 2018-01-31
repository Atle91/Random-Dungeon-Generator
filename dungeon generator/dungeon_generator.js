  import {applyMiddleware, compose, createStore, dispatch } from "redux";
  import React, { Component } from "react";
  import { Provider, connect } from "React-redux";
  import ReactDOM from "react-dom";
  import _ from "underscore";
  let stop = false;
  let timeOut;

  function dungeon(){
    const cellWidth = document.getElementById("ignore").getBoundingClientRect().width;
    const gridWidth = 61;
    const gridHeight = 61;
    const roomAmount = 25;
    let c = 0;
    console.log(cellWidth)
    let safeCoords = [];
    let initialState, rooms, idx, grid, roomWall,
    corridorCoords, wall, doors, indexToSplice, timeMult;
    initialState = {
      entities: {
        "player": {
          type: "player",
          x: 0,
          y: 0
        }
      },
      occupiedSpaces: {
        "0 0": "player"
      },
      staticMap: [],
      darkness: false,
      index: 0
    };

    function initDungeon(){
     rooms = 0;
     idx = 0;
     safeCoords = [];
     grid = [];
     roomWall = [];
     corridorCoords = [];
     wall = [];
     doors = [];
     indexToSplice = [];
     for(let i = 0; i < gridWidth; i++){
      for(let j = 0; j < gridHeight; j++){
        grid.push({
          index: idx++,
          type: "cell wall",
          entity: false,
          row: i,
          col: j
        })
      }
    }

    initialState.staticMap = grid;
    createAllCoords();
    callRoom();
  }
  function CToI(x,y){
    const tempIndex = (x+(y*gridWidth));
    return tempIndex;
  }

  function updateGrid(time,x,y,type){
    if(stop) {
      while(timeOut--){
        window.clearTimeout(timeOut);
      }
      return;
    }
    let index = CToI(y,x);
    timeOut = window.setTimeout(() => {
      let ele = document.getElementById(index+"").className = type+" cell";
    }, 16*time)
  }




  function createAllCoords(){
    for(let i = 0; i < gridWidth; i++){
      for(let j = 0; j < gridHeight; j++){
        safeCoords.push(i+" "+j);
      }
    }
  }


  const removeCoords = (x,y) => {
    if(safeCoords.indexOf(x+" "+y) === -1) return;
    safeCoords.splice(safeCoords.indexOf(x+" "+y), 1);
  }

  const checkCoords = (x,y) => {
    return Boolean(safeCoords.indexOf(x+" "+y) !== -1);
  }

  const getCoords = (max) => {
    let random = _.random(safeCoords.length-1);
    let xy = safeCoords[random];
    xy = xy.split(" ");
    let x = Number(xy[0]);
    let y = Number(xy[1]);

    let odd = Boolean(x % 2 === 1 && y % 2 === 1);
    let outside = Boolean((x > gridWidth - 1 || y > gridHeight -1) || (x < 1 || y < 1));
    let inArray = Boolean(checkCoords(x,y));
    let cantMove = Boolean(!checkCoords(x+2,y) && !checkCoords(x-2,y) && !checkCoords(x,y+2) && !checkCoords(x,y-2))
    if(outside || !inArray || cantMove || !odd){
      max--;
      if(max === 0) return false;
      return getCoords(max);
    }
    return [x, y];
  }

  const getCorridorCoords = (tries) => {
    if(!tries) return false;
    let random = _.random(corridorCoords.length-1);
    let xy = corridorCoords[random];
    xy = xy.split(" ");
    let x = Number(xy[0]);
    let y = Number(xy[1]);
    let cantMove = Boolean(!checkCoords(x+2,y) && !checkCoords(x-2,y) && !checkCoords(x,y+2) && !checkCoords(x,y-2))
    if(cantMove)  {
      return getCorridorCoords(tries-1)};
      return [x, y];
    }

    const getCoordsForRoom = (width,height) => {
      let random = _.random(safeCoords.length-1);
      let xy = safeCoords[random];
      xy = xy.split(" ");
      let x = Number(xy[0]);
      let y = Number(xy[1]);
      if((x > (gridWidth - (width+1)) || y > (gridHeight - (height+1))) || (x < 1 || y < 1) ){
        return getCoordsForRoom(width, height);
      }

      return [x,y];
    }



    const createRoom = () => {
      let width = _.random(3,9);
      let height = _.random(3,9);
      let xy = getCoordsForRoom(width, height)
      let x = xy[0];
      let y = xy[1];


      if(!checkRoom(x,y, width, height)) return createRoom();


      for(let i = x; i < x + width; i++){
       for(let j = y; j < y + height; j++){
         removeCoords(i,j);
         updateGrid(c++,i,j,"room");
         if(stop) return;
       }
     }

   }
   function callRoom(){
    if(rooms < roomAmount){
      timeOut = setTimeout(() => {callRoom()
      }, 30);
      
      createRoom();
      if(stop) return;
      rooms++
      
    }else{
      makeCell();
    }
  }

  function checkRoom(x, y, width, height){
    let tempArr = [];
    for(let i = x-1; i < x + width+1; i++){
      for(let j = y-1; j < y + height+1; j++){
        if(!checkCoords(i,j)){
          return false;
        }else if((i < x || i === x + width) || (j<y || j === y + height)){
          tempArr.push(i+" "+j);
        }
      } 
    }
    tempArr.map(coords =>{ 
      safeCoords.splice(safeCoords.indexOf(coords),1);
      let split = coords.split(" ");
    });

    roomWall.push(tempArr);
    return true;
  }



  function makeCell(){

    let xy = (corridorCoords.length) ? getCorridorCoords(40) : getCoords(30);
    if(!xy) xy = getCoords(30);
    if(!xy) {
      createDoors();
      return;
    };
    let x = xy[0];
    let y = xy[1];
    let cell = {
     x: x,
     y: y
   }
   carvePath(cell)
   if(stop) return;
   //setTimeout(() => {carvePath(cell)}, 50)

 }
 let count = 0;
 let teller = 0;


 function carvePath(cell){
  cell.up = (checkCoords(cell.x,cell.y-2) && cell.y > 1)   ? 0 : false;
  cell.right = (checkCoords(cell.x+2,cell.y) && cell.x < 58)  ? 1 : false;
  cell.down = (checkCoords(cell.x,cell.y+2) &&cell.y < 58)   ? 2 : false;
  cell.left = (checkCoords(cell.x-2, cell.y) && cell.x > 1)  ? 3 : false;
  let marker = 0;

  
  let direction = [];
  
  if(cell.up === 0) direction.push(cell.up);
  if(cell.right) direction.push(cell.right);
  if(cell.down)  direction.push(cell.down);
  if(cell.left)  direction.push(cell.left);
  

  

  
  corridorCoords.push(cell.x+" "+cell.y);
  removeCoords(cell.x, cell.y);
  updateGrid(c++,cell.x,cell.y, "corridor");
  if(stop) return;

  let move = direction[_.random(direction.length-1)];
  let newCell = _.clone(cell);

  if(move > -1){




    if(move === 0) {
      newCell.y = cell.y-2;
      
      removeCoords(cell.x,cell.y-1);
      updateGrid(c++,cell.x,cell.y-1,"corridor")
    }
    if(move === 1) {
      newCell.x = cell.x+2;
      
      removeCoords(cell.x+1,cell.y);
      updateGrid(c++,cell.x+1,cell.y,"corridor")
    }

    if(move === 2) {
      newCell.y = cell.y+2;
      
      removeCoords(cell.x,cell.y+1);
      updateGrid(c++,cell.x,cell.y +1,"corridor")
    }

    if(move === 3) {
      newCell.x = cell.x-2; 
      
      removeCoords(cell.x-1,cell.y)
      updateGrid(c++,cell.x-1,cell.y,"corridor")
    }
    //setTimeout(() => {carvePath(newCell)}, 30)
    if(stop) return;
    carvePath(newCell)
  }else{
    if(stop) return;
    makeCell();
    //setTimeout(() => {makeCell()}, 12 )
  }
  
}
const checkCorridor = (y,x,n) => {
  let checkUp =    Boolean(corridorCoords.indexOf((y-n)+" "+x) > -1);
  let checkRight = Boolean(corridorCoords.indexOf(y+" "+(x+n)) > -1);
  let checkDown =  Boolean(corridorCoords.indexOf((y+n)+" "+x) > -1);
  let checkLeft =  Boolean(corridorCoords.indexOf(y+" "+(x-n)) > -1);
  if((checkUp || checkRight) || (checkDown || checkLeft)){
    timeMult++;
    updateGrid(c++,y,x,"corridor")
    if(stop) return;
    indexToSplice.push(y+" "+x);
    doors.push(y+" "+x);
    if(n === 2){

      if(checkUp){ y -= 1}
        else if(checkRight){ x += 1}
          else if(checkDown){ y += 1}
            else if(checkLeft){ x -= 1}
              timeMult++;
            updateGrid(c++,y,x,"corridor")
            if(stop) return;
            //(function(y, x){setTimeout(() => updateGrid(y,x,"corridor"), 100*timeMult)})(y,x)
            indexToSplice.push(y+" "+x);
          }

          return true;
        }

        return false;
      }

      const createDoors = () => {

        for (let i = 0; i < roomWall.length; i++){
          let n = 1;
          for(let j = 1; j < roomWall[i].length-1; j++){


            if (j === roomWall[i].length-2){
              n++;
              j = 1;
              if (n === 3) break;
            }
            let xy = roomWall[i][j].split(" ");
            let y = Number(xy[0]);
            let x = Number(xy[1]);

      //Check if corner
      if(j > 3 && j < roomWall[i].length - 4){

        let prevXY = roomWall[i][j-2].split(" ");
        let prevX = Number(prevXY[1]);
        let futureXY = roomWall[i][j+2].split(" ");
        let futureX = Number(futureXY[1]);
        if((prevX < x && futureX === x) || (x === prevX && x < futureX)){

          continue;
        }else if(checkCorridor(y,x,n)) {

          checkCorridor(y,x,n)
          break;
        }
        
        
      }else{

        if(checkCorridor(y,x,n)){

          break;
        }
      }
    }
  }
}



//////////////////////////////////////////////////////////////////////////////////////////
// Redux:


const createWalls = () => {


  roomWall.map(room => {
    room.map((cell, i) => {
      wall.push(cell);
    })
  })

  indexToSplice.map((coords,i) => {
    if(wall.indexOf(coords) > -1){
      wall.splice(wall.indexOf(coords),1);
    }
  })
  

  safeCoords.map(coords => {
    if(indexToSplice.indexOf(coords) === -1) {
      wall.push(coords);
    }
  })

  
  
  grid.map((cell) => {
    if(wall.indexOf(cell.row+" "+cell.col) > -1){
      grid[cell.index].type = "wall" + " cell";
    }
  })
}







class Dungeon extends Component{
  constructor(props){
    super(props)
    
  }
  /*
  componentWillMount(){
    
    
  }
  
  componentDidMount(){
    this.drawMap()
   // this.storeChanged();
  //  this.unsubscribe = store.subscribe(this.storeChanged);
 // window.addEventListener('keydown', this.handleKeyPress.bind(this));
}

componentWillUnmount(){
   // this.unsubscribe();
   window.removeEventListener("keydown", this.handleKeyPress);
 }
 
 setupMap(){
    //place player
    const playerCoords = this.getLocation();
    this.props.onSetLocation("player", playerCoords);
    
    //add enemies
    this.props.onAddEntity("Minion", "Enemy", 35, 10, 20, this.getLocation());
    
    
  }
  storeChanged(){
   // const newState = this.props.getState();
 }
 getLocation(){
  let coords = corridorCoords[_.random(corridorCoords.length -1)].split(" ");
  const x = Number(coords[0]);
  const y = Number(coords[1]);
  if(wall.indexOf(y+" "+x) > -1) {
    return this.getLocation()}
    return {x, y}
  }
  handleKeyPress(e){
    let vector = "";
    switch(e.keyCode){
      case 37:
      vector = {x: -1, y:0};
      break;
      case 38:
      vector = {x: 0, y:-1};
      break;
      case 39:
      vector = {x: 1, y: 0};
      break;
      case 40:
      vector = {x:0, y: 1};
      break;
    }
    if (vector){
      e.preventDefault();
      this.handleMove(vector);
    }
  }

  
  handleMove(vector){
    if(this.checkMove("player", vector)){
      this.props.onMove("player", vector);
    }
  }
  checkMove(entity, vector){
   let checkX = this.props[entity].x + vector.x;
   let checkY = this.props[entity].y + vector.y;
   if(wall.indexOf(checkY+" "+checkX) > -1 || (checkX > 59 || checkX < 0)|| (checkY > 59 || checkY < 0)){
     return false
   }else{
     return true
   }
 }
 light(dir, player){
  let yPos = player.y;
  let xPos = player.x;
  while(grid[yPos][xPos].type !== "wall"){
    grid[yPos][xPos].light = true;
    if(dir===0)yPos--;
    if(dir===1)xPos++;
    if(dir===2)yPos++;
    if(dir===3)xPos--;
  }
  if(dir < 3)return this.light(dir+1, player);
}
*/

render(){

  const style = {
    width: (gridWidth * cellWidth)
  }




  const test = initialState.staticMap.map((cell)=>{
    return <Cell 
    cellClass = {cell} 
    key = {cell.index}/>
  })


  return(
    <div className="dungeon-board" style={style}>
    {test}
    
    
    </div>
    )
  firstRender = false;
}
}

class Cell extends Component{



  render(){
    return(
      <div className = {this.props.cellClass.type}
      id={this.props.cellClass.index}></div>
      )
  }
}




initDungeon();

ReactDOM.render(
  <Dungeon />,
  document.getElementById("root"));

}
$(".generate").click(() => {
 while(timeOut--){
   window.clearTimeout(timeOut);
 }
 dungeon();
 
})

