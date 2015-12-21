/* @pjs crisp="true"; */
/* @pjs pauseOnBlur="true"; */ 

class Star {
	PVector _p;
	float size;
	color c;

  Star() {
    _p = new PVector();
    reset(true);
  }

  void reset(boolean initial) {
    float angle = random(0, TWO_PI);
    int min_r = int((height * 2) * min_radius);
    int max_r = int(height * max_radius);

    float r = random(min_r, max_r);
    _p.x = width/2 + cos(angle) * r;
    _p.y = height/2 + sin(angle) * r;

    if ( initial ) {
      _p.z = random(-depth, 0);
    }
    else {
      _p.z = -depth;
    }

		size = random(5, 10);
  }
  
  void update() {
    _p.z += step;
  }

  void render() {
    pushMatrix();
    translate(_p.x, _p.y, _p.z);
    rect(0, 0, size, size);
    popMatrix();
  }

  boolean visible() {
    return (_p.z <= 10);
  }
};


int bgcolor = 0;
Star[] stars;
int count = 2500;
int depth = 5000;
int step = 20;
int fps = 30;

float min_radius = 0.2;
float max_radius = 4;

int display_width;
int display_height;


void setup() {
  display_width = screen.width;
  display_height = screen.height;

  fps = 30;

	size(display_width, display_height, P3D);
	smooth();
	frameRate(fps);

  stars = new Star[count];
   
  for(int index = 0; index < count; index++) {
    stars[index] = new Star();
  }
}


void draw() {
  background(bgcolor);

  for(int index = 0; index < count; index++) {
    Star s = stars[index];
    if ( ! s.visible() ) {
      s.reset(false);
    }
    s.update();
    s.render();
  }
}
