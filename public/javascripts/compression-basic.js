$(document).ready(function() {
  
		 
	  var exerciseData;
	  var context = new AudioContext();
	  var audio = new Audio();
	  var source = context.createMediaElementSource(audio);
	  var compressor = context.createDynamicsCompressor();
	  var gainNode = context.createGain();
	  source.connect(compressor);
	  compressor.connect(gainNode);
	  gainNode.connect(context.destination);
	  var playing = false;
	  var newQuestion = false;
	  var randomNr;
	  var choseAnswer;
	  var changeActive = false; // checks whether you already clicked B button or not
	  var hasRepeated = false; // If a user has clicked on the Replay button and clicks on the correct answer UserScore is NOT updated
	  var userScore;
	  var questionCount;
	  var drillNumber = 0;
	  //var eqGain = exerciseData[drillNumber].boost;
		
	  
	  // Help button and Modal
	  $(".button-help").click(function() {
		  $(this).toggleClass('button-close');
		 $(".help-modal").fadeToggle("fast");
	  });
	 
	  // Fetch exercise data 
	  function getData() {
	  	var url = window.location.pathname.split('/').pop();
	  	console.log(url);
	  	$.getJSON("../../data/compression/" + url + ".json", function(data) {
		   exerciseData = data;
		   createExercise(); 
		});	 
	  }
		 
	  getData();
	
	  function createExercise() {
	  	console.log(exerciseData);
		 playing = false;
		 $("#drill-screen").hide();
		 $("#final-screen").hide();
		 $("#drill-screen").fadeIn(500);
		  // Declare variables for User Stats
		 hasRepeated = false;
	     userScore = 0;
	     questionCount=1;
		 updateUserStats();
	     generateButtons();
		 
		 // Set active drill button
		  $(".drill-menu li").removeClass("active"); 
		  $(".drill-menu li:eq("+drillNumber+")").addClass("active");
		 // Choose new drill
		 $(".drill-menu li").click(function() {
		   drillNumber = $(this).val();
		   createExercise();
		 });
		  
	 	 		 
		 // Load sounds
		 audio.src = "../../sounds/compression/" + exerciseData[drillNumber].sounds;
		
	    
	  
	       
	   $(".btn-play").click(function() {
		    if (!playing) {
			   playOriginal();
			}
	   });
	   
	  function playOriginal() {
	  	audio.pause();
		 audio.currentTime = 0;
		 gainNode.gain.cancelScheduledValues(audio.currentTime);
		 $("#original li").removeClass('clicked-original');
		 $(".btn-original").addClass('clicked-original');
		 playing = true;
		 compressor.threshold.value = 0;
		 compressor.release.value = 0.250;
		 compressor.attack.value = 0.050;
		 gainNode.gain.value = 1;
		 audio.play();
		 setTimeout(playChanged, 3000);
	  }
	  
	  function playChanged() {
	  	audio.pause();
	  	audio.currentTime = 0;
	           

		 $("#original li").removeClass('clicked-original');
		 $(".btn-changed").addClass('clicked-original');
		 
		 if (!changeActive) {
		    randomNr = Math.floor(Math.random() * exerciseData[drillNumber].nrOfButtons);	
		 }
         
         var myGain = exerciseData[drillNumber].gain[randomNr];
        
         //gainNode.gain.setValueAtTime(gainNode.gain.value, audio.currentTime); 

         //gainNode.gain.exponentialRampToValueAtTime(myGain, audio.currentTime + 0.9);


		 
		 compressor.threshold.value = exerciseData[drillNumber].threshold[randomNr];
		 gainNode.gain.value = exerciseData[drillNumber].gain[randomNr];

		 
		 compressor.attack.value = exerciseData[drillNumber].attack[randomNr];
		 compressor.release.value = exerciseData[drillNumber].release[randomNr];
		 changeActive = true;
		 audio.play();
		 setTimeout(checkAnswer, 3000);
	  }
	  
	  function checkAnswer() {
		 audio.pause();
		 $("#original li").removeClass('clicked-original');
		 playing = false;
		 		 
		 if (!playing && !choseAnswer) {
		   
		    $('#buttons').unbind().on('click', 'li', function(event) {
			    var correctAnswer = randomNr;
				var selectedAnswer = $(this).val();
				if ((correctAnswer === selectedAnswer) && changeActive) {
				   if (!choseAnswer) {
				   userScore++;
				   choseAnswer = true;
				   }
				   // Make button GREEN
				   $(this).addClass('backValid');
				} else if ((correctAnswer !== selectedAnswer) && changeActive) {
				   // Make button RED
				   $(this).addClass('backInvalid');
				   choseAnswer = true;
			    }
				if (choseAnswer) {
					$(".btn-submit").addClass("btn-submit-active");
				}
				
			});
		 }
		   $(".box-bottom-right .btn-submit").click(function() {
			 if (choseAnswer) {
			    if (questionCount === 10) {
			       questionCount++;
				   updateUserStats();
				   endExercise();
				} else {
				nextQuestion();
				}
			 }
		    });
	  }
	  
	  function nextQuestion() {
		  audio.pause();
		  audio.currentTime = 0;
		  $(".btn-submit").removeClass("btn-submit-active");
		  $("#original li").removeClass('clicked-original');
		  $("#buttons li").removeClass('backValid').removeClass('backInvalid');
		  changeActive = false;
		  console.log(changeActive);
		  choseAnswer = false;
		  questionCount++;
		  updateUserStats();
		  // $("#buttons, #original").fadeOut(300);
		  $("#buttons, #original").animate({opacity: "0.0", left:"+=600px"},300);   
		  $("#buttons, #original").animate({left:"-=1200px"});  
		  $("#buttons, #original").animate({opacity: "1.0", left:"+=600px"}, 300);  
	  }
	  
	  function generateButtons() {
	     $("#buttons").html("");
		 
		 // Generate drill circle buttons
		 var numberOfButtons = exerciseData.length;
		  $(".drill-menu").html("DRILL");
		 for (var j = 0; j < numberOfButtons; j++) {
			 $('.drill-menu').append('<li value="' + j + '"></li>');
		 }

		 // Generate answer buttons		   
		 if (exerciseData[drillNumber].nrOfButtons < 6) {
		    for (var i = 0; i < exerciseData[drillNumber].nrOfButtons; i++) {
		          $("#buttons").append('<li value="' + i + '" class="btn-ex btn-default btn-single">' +  
							             exerciseData[drillNumber].buttonText[i] + 
							            '</li>');
		  	} 
		 } else {
		    for (var i = 0; i < exerciseData[drillNumber].nrOfButtons; i++) {
		       $("#buttons").append('<li value="' + i + '" class="btn-ex btn-default btn-double">' +  
			      exerciseData[drillNumber].buttonText[i] + 
			     '</li>');
			}
		 }
			     //$(".buttons-left p").html(exerciseData[drillNumber].sideText[0]);
			     // $(".buttons-right p").html(exerciseData[drillNumber].sideText[1]);
		     
	  }
	  	  
	  function generatePanelHtml(text) {
	     $('.box-top-middle').html(text);  
	  }
	  
	  function updateUserStats() {
	      $('.box-top-right h2').html(userScore * 10);
		  var progress = $(".progress-bar").width() / 10 * (questionCount -1);
	      
		  $('.progress-bar-progress').animate({width: progress}, 400);
	  }
	  
	  	  
	  function endExercise() {
          questionCount = 10;
		  $("#drill-screen").hide();
		  $("#final-screen").fadeIn(500);
		  $(".btn-submit").removeClass("btn-submit-active");
		 
		  var scoreFraction = userScore / 10;
		  var scorePercentage = scoreFraction * 100;
		  scorePercentage = scorePercentage.toFixed(0);
		 
		  var myCircle = Circles.create({
  			id:                  'circles-1',
 			radius:              80,
 			value:               scorePercentage,
 			maxValue:            100,
 			width:               10,
  			text:                function(value){return value + '%';},
  			colors:              ['#C6C6C6', '#CC3B3B'],
  			duration:            400,
 			wrpClass:            'circles-wrp',
 			textClass:           'circles-text',
 			valueStrokeClass:    'circles-valueStroke',
 			maxValueStrokeClass: 'circles-maxValueStroke',
 			styleWrapper:        true,
  			styleText:           false
           });

		  $('.score-correct').html(userScore);
          $('.score-final').html(userScore * 10);
		  
		 
		  
		  // Repeat drill
		  $("#final-screen .btn-again").click(function() {
			  getData();
		  });
		  
		  // Repeat exercise
		  $("#final-screen .btn-next").unbind().click(function() {
			  drillNumber++;
			  getData();
		  });
	  }
   };


});