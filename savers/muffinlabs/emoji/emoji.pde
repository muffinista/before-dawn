/* @pjs pauseOnBlur="true"; */ 


Star[] stars;

int count = 200;
int depth = 2000;
int step = 20;
//int fade_depth = 1000;
int fps = 30;

float min_radius = 0.3;
float max_radius = 4;

int num_sprites = 50;
PImage sprites[];

int bgcolor = 0;

int min_r; // = int((height * 2) * min_radius);
int max_r; // = int(height * max_radius);

class Star {
 PVector _p;
 int sprite;
 float r;
 float angle;

  Star() {
    _p = new PVector();
    r = random(min_r, max_r);
    angle = random(0, TWO_PI);

    reset(true);
  }

  void reset(boolean initial) {

    _p.x = width/2 + cos(angle) * r;
    _p.y = height/2 + sin(angle) * r;

    if ( initial ) {
      sprite = (int)random(0, num_sprites);
      _p.z = random(-depth, 0);
    }
    else {
      _p.z = -depth;
    }
  }
  
  void update() {
    _p.z += step;
  }

  void render() {
    pushMatrix();
    translate(_p.x, _p.y, _p.z);

    image(sprites[sprite], 0, 0);
    popMatrix();
  }

  boolean visible() {
    return (_p.z <= 10);
  }
};

int min_sprite = 1;
int max_sprite = 872;

void setup() {
  if ( typeof(window.urlParams) !== "undefined" ) {
    display_width = window.urlParams.width;
    display_height = window.urlParams.height;
    console.log(window.urlParams);
    count = window.urlParams.density * 2;
    console.log("set count to " + count);
  }
  else {
    display_width = screen.width;
    display_height = screen.height;
  }
  
  size(display_width, display_height, P3D);

  min_r = int((height * 2) * min_radius);
  max_r = int(height * max_radius);


  sprites = new PImage[num_sprites];

  // load a pile of random sprites
  for ( int i = 0; i < num_sprites; i++ ) {
    int index = int(random(min_sprite, max_sprite));
    PImage tmp = loadImage("data/" + index + ".png");
    sprites[i] = tmp;
  }
 
  noStroke();
  frameRate(fps);

  stars = new Star[count];
   
  for(int index = 0; index < count; index++) {
    stars[index] = new Star();
  }
}

void draw() {
  background(0);
 
  for(int index = 0; index < count; index++) {
    Star s = stars[index];
    if ( ! s.visible() ) {
      s.reset(false);
    }
    s.update();
    s.render();
  }
}
