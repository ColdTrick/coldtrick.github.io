function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + "; " + expires;
} 

function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i=0; i<ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1);
        if (c.indexOf(name) == 0) return c.substring(name.length,c.length);
    }
    return "";
}

var current_access_token = getCookie('github_user_token');

$(function() {
	$.ajaxSetup({
		beforeSend: function(xhr) {
			if (current_access_token !== '') { 
				xhr.setRequestHeader('Authorization', 'token ' + current_access_token);
			}
		}
	});
	
	$.getJSON('https://api.github.com/users/coldtrick/repos?sort=pushed&per_page=200', function(repos) {
  		$select = $('#commit_aggregator select');
  		if (repos) {
			$(repos).each(function(index, repo) { 
				$select.append('<option>' + repo.full_name.toLowerCase() + '</option>');
			});
  		}
	});
	
  	
	$('#commit_aggregator').submit(function() {
  		$form = $(this);
  		$submit = $form.find('button');
  		$submit.attr('disabled', 'disabled').find('.fa').removeClass('hidden');

		var repo = $form.find('select').val();

		if (!repo) {
			$('#commit_aggregator_results').html('');
			$submit.attr('disabled', false).find('.fa').addClass('hidden');
			return false;
		}

		var results = '<h4>Results</h4>';
		
		$.getJSON('https://api.github.com/repos/' + repo + '/tags', function(tags) {
			if (tags) {
				var latest_tag = tags[0].name;
				results += '<p class="text-muted">Comparing master against tag ' + latest_tag + '</p>';

				$.getJSON('https://api.github.com/repos/' + repo + '/compare/' + latest_tag + '...master', function(data) {

					var sorted_commits = [];
					 
					if(data.commits) {
						$(data.commits).each(function(id, commit) {
							if (commit.commit.message.indexOf("Merge pull request") !== 0) {
								sorted_commits.push(commit);
							}
						});
					}

					sorted_commits.sort(function(a,b) {
						return a.commit.message.toLowerCase().localeCompare(b.commit.message.toLowerCase());
					});
					
					$.each(sorted_commits, function(index, commit) {
						results += '<a href="' + commit.html_url + '" target="_blank">- ' + commit.commit.message + '</a><br />';
					});
					
					$('#commit_aggregator_results').html(results);
					
					$submit.attr('disabled', false).find('.fa').addClass('hidden');
					
		  		});
				
			} else {
				results += 'no releases available';

				$('#commit_aggregator_results').html(results);
				
				$submit.attr('disabled', false).find('.fa').addClass('hidden');
			}
			
		});
  		
  		
  		return false;
	});
	
	// User github access token	
	if (current_access_token) {
		$("#set-token, #remove-token").toggleClass("hidden");
	}
	$("#set-token").click(function() {
		var val = prompt("Please enter your token here");
		if (val) {
			current_access_token = val;
			setCookie('github_user_token', val, 365);
			$("#set-token, #remove-token").toggleClass("hidden");
		}
	});
	$("#remove-token").click(function() {
		setCookie('github_user_token', '');
		current_access_token = '';
		$("#set-token, #remove-token").toggleClass("hidden");
	});
});