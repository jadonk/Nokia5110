//
// Copyright (C) 2012 - Cabin Programs, Ken Keller
// 
// Some code derived from example code at: http://www.arduino.cc/playground/Code/PCD8544
// and http://blog.stuartlewis.com/2011/02/12/scrolling-text-with-an-arduino-and-nokia-5110-screen/
//

var b = require('bonescript');

//
//  Must define the following outputs in your program to use LCD_5110.js
//
//     PIN_SCLK  = exports.PIN_SCLK  = bone.P?_?;
//     PIN_SDIN  = exports.PIN_SDIN  = bone.P?_?;
//     PIN_DC    = exports.PIN_DC    = bone.P?_?;
//     PIN_SCE   = exports.PIN_SCE   = bone.P?_?;
//     PIN_RESET = exports.PIN_RESET = bone.P?_?;
//

//
//  used in lcdInverse(mode)
//
var LCD_INVERSE = exports.LCD_INVERSE = 0;
var LCD_NORMAL = exports.LCD_NORMAL = 1;

//
// used internally - size of display in pixels
//
var LCD_X = exports.LCD_X = 84;
var LCD_Y = exports.LCD_Y = 48;

//
// used in: lcdWrite(command, data)
//
var LCD_COMMAND = exports.LCD_COMMAND = 0;
var LCD_DATA = exports.LCD_DATA = 1;

//
// lcdSetup ()
//     reset lcd ancd set up set up display contrast and bias
//
exports.setup = function() 
{
    //console.log("PIN_SCLK = " + this.PIN_SCLK);
    //console.log("PIN_SDIN = " + this.PIN_SDIN);
    //console.log("PIN_DC = " + this.PIN_DC);
    //console.log("PIN_SCE = " + this.PIN_SCE);
    //console.log("PIN_RESET = " + this.PIN_RESET);

    b.pinMode(this.PIN_SCLK, b.OUTPUT);
    b.pinMode(this.PIN_SDIN, b.OUTPUT);
    b.pinMode(this.PIN_DC, b.OUTPUT);
    b.pinMode(this.PIN_SCE, b.OUTPUT);
    b.pinMode(this.PIN_RESET, b.OUTPUT);

    //Reset the LCD to a known state
    b.digitalWrite(this.PIN_RESET, b.LOW);
    b.digitalWrite(this.PIN_RESET, b.HIGH);

    exports.write(LCD_COMMAND, 0x21, true); 
    exports.write(LCD_COMMAND, 0xB1, true); 
    exports.write(LCD_COMMAND, 0x04, true); 
    exports.write(LCD_COMMAND, 0x15, true); 

    exports.write(LCD_COMMAND, 0x20, true); 
    exports.write(LCD_COMMAND, 0x0C); 
};

//
// lcdWrite(dataORcommand, data)
//      Write dataor command to lcd
//
var lastDC = undefined;
var lastSCE = undefined;
exports.write = function(dataORcommand, data, backToBack) 
{
    //backToBack = false;
    //console.log("write("+dataORcommand+","+data+")");
    if(lastDC != dataORcommand) {
        b.digitalWrite(this.PIN_DC, dataORcommand); //Tell the LCD that we are writing either to data or a command
        lastDC = dataORcommand;
    }

    if(dataORcommand == LCD_DATA) {
        if(typeof lastX !== 'undefined' && typeof lastY !== 'undefined') {
            lastX++;
            if(lastX == LCD_X) {
                lastX = 0;
                lastY++;
                if(lastY == LCD_Y) lastY = 0;
            }
        }
    }

    //Send the data
    if(!backToBack || lastSCE != b.LOW) {
        b.digitalWrite(this.PIN_SCE, b.LOW);
    }
    for(var i = 0; i < 8; i++) {
        var bit = data & (1 << (7 - i));

        if(bit) {
            b.digitalWrite(this.PIN_SDIN, b.HIGH);
        } else {
            b.digitalWrite(this.PIN_SDIN, b.LOW);
        }
        b.digitalWrite(this.PIN_SCLK, b.HIGH);
        b.digitalWrite(this.PIN_SCLK, b.LOW);
    }
    if(!backToBack) {
        b.digitalWrite(this.PIN_SCE, b.HIGH);
        lastSCE = b.HIGH;
    }
};

//
// lcdGotoXY(column, row)
//     set current lcd position to row/column
//
var lastX = undefined;
var lastY = undefined;
exports.gotoXY = function(x, y, backToBack) 
{
    if(x != lastX || y != lastY) {
        exports.write(LCD_COMMAND, 0x80 | x, true);  // Column
        exports.write(LCD_COMMAND, 0x40 | y, backToBack);  // Row
        lastX = x;
        lastY = y;
    }
};

//
// lcdInverse(mode)
//    turn inverse mode on or off
//
exports.inverse = function(invert)
{
    if (invert == LCD_INVERSE)
    {
        exports.write(LCD_COMMAND, 0x0D);  //set inverse mode
    } else
    {
        exports.write(LCD_COMMAND, 0x0C);  //set normal mode
    }
};

//
// lcdBitmap(array)
//    send bitmap to LCD at current position
//
exports.bitmap = function(array)
{
  var index;
  var amt = (LCD_X * LCD_Y ) / 8;
  if (array.length < amt) amt = array.length;
  for (index = 0 ; index < amt ; index++)
     exports.write(LCD_DATA, array[index], index - 1 < amt);
};


//
// lcdCharacter(char)
//    outputs ASCII char (0x20 - 0x7f) at current position
//
exports.character = function(character, backToBack) 
{
  var index;
  var char;

  char = character.charCodeAt(0);

  if (char != 0x7f) exports.write(LCD_DATA, 0x00, true); //Blank vertical line padding
     else exports.write(LCD_DATA, 0xff, true);           // make total black pixel

  for ( index = 0 ; index < 5 ; index++)
     exports.write(LCD_DATA, ascii[((char-0x20)*5)+index], true);

  if (char != 0x7f) exports.write(LCD_DATA, 0x00, backToBack); //Blank vertical line padding
     else exports.write(LCD_DATA, 0xff, backToBack);           // make total black pixel
};

//
// lcdString(string)
//    outputs ASCII string (0x20 - 0x7f) at current position
//
exports.string = function(characters) 
{
  var index;
  for ( index = 0 ; index < characters.length ; index++)
  {
      exports.character(characters[index], index-1<characters.length);
  }
};

//
// lcdClear()
//     clears lcd by sending spaces to the entire display
//     leaves current position at (0,0)
//
exports.clear = function() 
{
  var index;
  var amt;
  exports.gotoXY(0, 0, true);
  amt = (LCD_X * LCD_Y ) / 8
  for (index = 0 ; index < amt ; index++)
     exports.write(LCD_DATA, 0x00, true);
  exports.gotoXY(0, 0);     //Always start at home
};

//
//  Scroll routines:   (scrolls happen on one row between (4,row) and (82,row)
//      lcdScrollInit(row)  -  clears the scroll area and init local vars
//      lcdScroll(row, string)  -  scrolls string one char, repeat call to scroll again
//      lcdScrollLength(string) - returns number to scroll string one time off screen
//

var scrollPosition = [-10, -10, -10, -10, -10, -10] ;   // internal storage for scroll routines

exports.scrollLength = function(array)
{
    return (array.length +10);
};

exports.scrollInit = function(row)
{
  var i;
  exports.gotoXY(4,row,true);
  scrollPosition[row] = -10;
  for (i=0; i<11; i++)
      exports.character(' ', i<10);
};

exports.scroll = function( row ,message )
{
  var i;
  exports.gotoXY(4,row,true);
  for (i = scrollPosition[row]; i < scrollPosition[row] + 11; i++)
  {
    if ((i >= message.length) || (i < 0))
    {
      exports.character(' ');
    }
    else
    {
      exports.character(message.charAt(i));
    }
  }
  scrollPosition[row]++;
  if ((scrollPosition[row] >= message.length) && (scrollPosition[row] > 0))
  {
    scrollPosition[row] = -10;
  }
};

//
//  Progress Bar Routines
//      lcdProgressInit(row)  -  clears the scroll area and init local vars
//      lcdProgressBar(row, value)  -  draws a progress bar of value length
//                                     value from 0 to 100
//
var curProgress = [0,0,0,0,0,0];   // internal storage for progress bar routines
exports.progressInit = function (row)
{
    var index;
    exports.gotoXY(0,row,true);
    for(index = 0; index<12; index++)
        exports.character(' ',index<11);
    curProgress[row] = 0;
};

exports.progressBar = function (row, value)
{
    var index;

    value = Math.floor((80*value)/100);

    if (value>80) value = 80;
      else if (value<0) value =0;
    
    exports.gotoXY(2,row,true);
    if (value > curProgress[row])
    {
       exports.gotoXY(2+curProgress[row],row,true);
       for(index = curProgress[row]; index < value; index++)
          exports.write(LCD_DATA, 0x7e, index-1<value);
    } else if (value < curProgress[row])
    {
       exports.gotoXY(2+value,row, true);
       for(index = value; index<curProgress[row]; index++)
          exports.write(LCD_DATA, 0x00, index-1<curProgress[row]);
    }

    curProgress[row] = value;
};

//
// ASCII bitmaps...
//
var ascii =  [
   0x00, 0x00, 0x00, 0x00, 0x00 // 20  
  ,0x00, 0x00, 0x5f, 0x00, 0x00 // 21 !
  ,0x00, 0x07, 0x00, 0x07, 0x00 // 22 "
  ,0x14, 0x7f, 0x14, 0x7f, 0x14 // 23 #
  ,0x24, 0x2a, 0x7f, 0x2a, 0x12 // 24 $
  ,0x23, 0x13, 0x08, 0x64, 0x62 // 25 %
  ,0x36, 0x49, 0x55, 0x22, 0x50 // 26 &
  ,0x00, 0x05, 0x03, 0x00, 0x00 // 27 '
  ,0x00, 0x1c, 0x22, 0x41, 0x00 // 28 (
  ,0x00, 0x41, 0x22, 0x1c, 0x00 // 29 )
  ,0x14, 0x08, 0x3e, 0x08, 0x14 // 2a *
  ,0x08, 0x08, 0x3e, 0x08, 0x08 // 2b +
  ,0x00, 0x50, 0x30, 0x00, 0x00 // 2c ,
  ,0x08, 0x08, 0x08, 0x08, 0x08 // 2d -
  ,0x00, 0x60, 0x60, 0x00, 0x00 // 2e .
  ,0x20, 0x10, 0x08, 0x04, 0x02 // 2f /
  ,0x3e, 0x51, 0x49, 0x45, 0x3e // 30 0
  ,0x00, 0x42, 0x7f, 0x40, 0x00 // 31 1
  ,0x42, 0x61, 0x51, 0x49, 0x46 // 32 2
  ,0x21, 0x41, 0x45, 0x4b, 0x31 // 33 3
  ,0x18, 0x14, 0x12, 0x7f, 0x10 // 34 4
  ,0x27, 0x45, 0x45, 0x45, 0x39 // 35 5
  ,0x3c, 0x4a, 0x49, 0x49, 0x30 // 36 6
  ,0x01, 0x71, 0x09, 0x05, 0x03 // 37 7
  ,0x36, 0x49, 0x49, 0x49, 0x36 // 38 8
  ,0x06, 0x49, 0x49, 0x29, 0x1e // 39 9
  ,0x00, 0x36, 0x36, 0x00, 0x00 // 3a :
  ,0x00, 0x56, 0x36, 0x00, 0x00 // 3b ;
  ,0x08, 0x14, 0x22, 0x41, 0x00 // 3c <
  ,0x14, 0x14, 0x14, 0x14, 0x14 // 3d =
  ,0x00, 0x41, 0x22, 0x14, 0x08 // 3e >
  ,0x02, 0x01, 0x51, 0x09, 0x06 // 3f ?
  ,0x32, 0x49, 0x79, 0x41, 0x3e // 40 @
  ,0x7e, 0x11, 0x11, 0x11, 0x7e // 41 A
  ,0x7f, 0x49, 0x49, 0x49, 0x36 // 42 B
  ,0x3e, 0x41, 0x41, 0x41, 0x22 // 43 C
  ,0x7f, 0x41, 0x41, 0x22, 0x1c // 44 D
  ,0x7f, 0x49, 0x49, 0x49, 0x41 // 45 E
  ,0x7f, 0x09, 0x09, 0x09, 0x01 // 46 F
  ,0x3e, 0x41, 0x49, 0x49, 0x7a // 47 G
  ,0x7f, 0x08, 0x08, 0x08, 0x7f // 48 H
  ,0x00, 0x41, 0x7f, 0x41, 0x00 // 49 I
  ,0x20, 0x40, 0x41, 0x3f, 0x01 // 4a J
  ,0x7f, 0x08, 0x14, 0x22, 0x41 // 4b K
  ,0x7f, 0x40, 0x40, 0x40, 0x40 // 4c L
  ,0x7f, 0x02, 0x0c, 0x02, 0x7f // 4d M
  ,0x7f, 0x04, 0x08, 0x10, 0x7f // 4e N
  ,0x3e, 0x41, 0x41, 0x41, 0x3e // 4f O
  ,0x7f, 0x09, 0x09, 0x09, 0x06 // 50 P
  ,0x3e, 0x41, 0x51, 0x21, 0x5e // 51 Q
  ,0x7f, 0x09, 0x19, 0x29, 0x46 // 52 R
  ,0x46, 0x49, 0x49, 0x49, 0x31 // 53 S
  ,0x01, 0x01, 0x7f, 0x01, 0x01 // 54 T
  ,0x3f, 0x40, 0x40, 0x40, 0x3f // 55 U
  ,0x1f, 0x20, 0x40, 0x20, 0x1f // 56 V
  ,0x3f, 0x40, 0x38, 0x40, 0x3f // 57 W
  ,0x63, 0x14, 0x08, 0x14, 0x63 // 58 X
  ,0x07, 0x08, 0x70, 0x08, 0x07 // 59 Y
  ,0x61, 0x51, 0x49, 0x45, 0x43 // 5a Z
  ,0x00, 0x7f, 0x41, 0x41, 0x00 // 5b [
  ,0x02, 0x04, 0x08, 0x10, 0x20 // 5c \
  ,0x00, 0x41, 0x41, 0x7f, 0x00 // 5d ]
  ,0x04, 0x02, 0x01, 0x02, 0x04 // 5e ^
  ,0x40, 0x40, 0x40, 0x40, 0x40 // 5f _
  ,0x00, 0x01, 0x02, 0x04, 0x00 // 60 `
  ,0x20, 0x54, 0x54, 0x54, 0x78 // 61 a
  ,0x7f, 0x48, 0x44, 0x44, 0x38 // 62 b
  ,0x38, 0x44, 0x44, 0x44, 0x20 // 63 c
  ,0x38, 0x44, 0x44, 0x48, 0x7f // 64 d
  ,0x38, 0x54, 0x54, 0x54, 0x18 // 65 e
  ,0x08, 0x7e, 0x09, 0x01, 0x02 // 66 f
  ,0x0c, 0x52, 0x52, 0x52, 0x3e // 67 g
  ,0x7f, 0x08, 0x04, 0x04, 0x78 // 68 h
  ,0x00, 0x44, 0x7d, 0x40, 0x00 // 69 i
  ,0x20, 0x40, 0x44, 0x3d, 0x00 // 6a j 
  ,0x7f, 0x10, 0x28, 0x44, 0x00 // 6b k
  ,0x00, 0x41, 0x7f, 0x40, 0x00 // 6c l
  ,0x7c, 0x04, 0x18, 0x04, 0x78 // 6d m
  ,0x7c, 0x08, 0x04, 0x04, 0x78 // 6e n
  ,0x38, 0x44, 0x44, 0x44, 0x38 // 6f o
  ,0x7c, 0x14, 0x14, 0x14, 0x08 // 70 p
  ,0x08, 0x14, 0x14, 0x18, 0x7c // 71 q
  ,0x7c, 0x08, 0x04, 0x04, 0x08 // 72 r
  ,0x48, 0x54, 0x54, 0x54, 0x20 // 73 s
  ,0x04, 0x3f, 0x44, 0x40, 0x20 // 74 t
  ,0x3c, 0x40, 0x40, 0x20, 0x7c // 75 u
  ,0x1c, 0x20, 0x40, 0x20, 0x1c // 76 v
  ,0x3c, 0x40, 0x30, 0x40, 0x3c // 77 w
  ,0x44, 0x28, 0x10, 0x28, 0x44 // 78 x
  ,0x0c, 0x50, 0x50, 0x50, 0x3c // 79 y
  ,0x44, 0x64, 0x54, 0x4c, 0x44 // 7a z
  ,0x00, 0x08, 0x36, 0x41, 0x00 // 7b {
  ,0x00, 0x00, 0x7f, 0x00, 0x00 // 7c |
  ,0x00, 0x41, 0x36, 0x08, 0x00 // 7d }
  ,0x10, 0x08, 0x08, 0x10, 0x08 // 7e ~
  ,0xff, 0xff, 0xff, 0xff, 0xff] // 7f (filled block)


