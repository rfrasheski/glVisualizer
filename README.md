Architecture and Design Brainstorm and Planning

 

 

visualizer.js

      main canvas entrance point

      

glMaster.js 

      expose methods to
visuzlier.js to stop/start and modify variables like scale

      

circle.js

      only purpose is to draw or
setup circles to be drawn

      takes in parameters from
glMaster

      returns set up circle
variables to glMaster ?

            build and compile
shaders

            vertexBuffer?

            define functions that
can be called? 

 

Questions

      what is the best way to draw
multiple shapes in gl 

      does each shape have its own
coordinate grid or do all need to fit in one?

      can you render multiple
shapes independently

      how to position shapes on
canvas 

            circles centered at
different points?

      how to do shapes movement and
disappearing in infinite hallway scene?

            how to determine when
to draw a shape if its position is out of bounds

            

Visuals Ideas

      colors

            set of agreeable colors
(look into color theory)

            background

                  morphing color
changes

                  gradient
morphing?

            shapes

                  set to
complementary color of background

                  set of distinct
colors that agree? depend on how many shapes

      morphing texture on circle

            set of circles with
medium thickness that scales down in repeating hypnotic pattern 

      movements: random set of
shape movement types

            examples: move left,
move down, change movement velocity, rotate

            change movement type
randomly on each beat

            end result would be a
reactively moving shape

                  extensions: 

                        shape
morphing 

                        shape
generation and combination/joining

                        impact
physics 


# glVisualizer

REQUIRED: INSTALL NODEJS TO RUN LOCALLY


Website UI

  NO SCROLLING
  
  Main startpage
    
    Gradient color background?
     
      or some example preview video of visualizer (stretch goal)
    
    Title 
      
      Large font
      
      Centered or in some prominent location on upper half
    
    Spotify Login button
      
      JS
      
      Integrate with Spotify login API to receive API credentials
   
   Transition to visualizer page
      
      ideally this would be a seemless transparency transition of startpage to visualizer canvas
      
      first iteration
        
        move to new page for simplicity?
    
   Visualizer 
      
      No buttons
      
      Status text 
        
        Currently playing track + sync info
        
        error messages 
       
        
