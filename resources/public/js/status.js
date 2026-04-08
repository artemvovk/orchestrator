
function addPrimaryTableData(name, column1, column2, column3, column4) {
	$(".status-table-primary").append(
    '<tr><td>' + name + '</td>' +
    '<td>' + column1 + '</td>' +
    '<td><code class="text-info">' + column2 + '</code></td>' +
    '<td><code class="text-info">' + column3 + '</code></td>' +
    '<td><code class="text-info long-text">' + column4 + '</code></td></tr>'
	);
}
function addRaftTableData(name, column1, column2) {
	$(".status-table-raft").append(
    '<tr><td>' + name + '</td>' +
    '<td>' + column1 + '</td>' +
    '<td><code class="text-info">' + column2 + '</code></td></tr>'
	);
}
function addRaftSeparator() {
	$(".status-table-raft").append(
		'<tr><td colspan="3"><hr style="margin:5px 0"></td></tr>'
	);
}
function addStatusActionButton(name, uri) {
	$("#orchestratorStatus .panel-footer").append(
		'<button type="button" class="btn btn-sm btn-info">'+name+'</button> '
	);
	var button = $('#orchestratorStatus .panel-footer button:last');
	button.click(function(){
		apiCommand("/api/"+uri);
	});
}

$(document).ready(function () {
	var statusObject = $("#orchestratorStatus .panel-body");
    $.get(appUrl("/api/health/"), function (health) {
    	statusObject.prepend('<h4>'+health.Message+'</h4>')
        $(".status-table-primary").append(
            '<tr><td></td>' +
            '<td><b>Hostname</b></td>' +
            '<td><b>Running Since</b></td>' +
            '<td><b>DB Backend</b></td>' +
            '<td><b>App Version</b></td></tr>'
        );
    	health.Details.AvailableNodes.forEach(function(node) {
				var app_version = node.AppVersion;
				if (app_version == "") {
					app_version = "unknown version";
				}
				var message = '';
				message += '<code class="text-info"><strong>';
				message += node.Hostname;
				message += '</strong></code>';
				message += '</br>';

				message += '<code class="text-info">';
				if (node.Hostname == health.Details.ActiveNode.Hostname && node.Token == health.Details.ActiveNode.Token) {
					message += '<span class="text-success">[Elected at '+health.Details.ActiveNode.FirstSeenActive+']</span>';
				}
				if (node.Hostname == health.Details.Hostname) {
					message += '<span class="text-primary">[This node]</span>';
    		}
				message += '</code>';

        var running_since ='<span class="text-info">'+node.FirstSeenActive+'</span>';
				var address = node.DBBackend;

        addPrimaryTableData("Available node", message, running_since, address, app_version);
    	})

    	var userId = getUserId();
    	if (userId == "") {
    		userId = "[unknown]"
    	}
    	var userStatus = (isAuthorizedForAction() ? "admin" : "read only");
      addPrimaryTableData("You", userId + ", " + userStatus, "", "", "");

			// Raft section - all from the single health response
			var stats = health.Details.RaftStats;
			if (health.Details.RaftLeader != "" || stats) {

				// This node
				var stateLabel = '<code>' + health.Details.RaftState + '</code>';
				if (health.Details.RaftHealthy) {
					stateLabel += ' <span class="text-success">healthy</span>';
				} else {
					stateLabel += ' <span class="text-danger">unhealthy</span>';
				}
				if (health.Details.RaftIsPartOfQuorum) {
					stateLabel += ' <span class="text-success">quorum member</span>';
				}
				addRaftTableData("This node", '<code>' + health.Details.RaftAdvertise + '</code>', stateLabel);

				// Leader
				if (health.Details.RaftLeader != "") {
					var leaderLabel = '<code class="text-info"><strong>' + health.Details.RaftLeader + '</strong></code>';
					if (health.Details.IsRaftLeader) {
						leaderLabel += ' <span class="text-primary">[This node]</span>';
					}
					var leaderURI = '';
					if (health.Details.RaftLeaderURI) {
						leaderURI = '<a href="' + health.Details.RaftLeaderURI + '">' + health.Details.RaftLeaderURI + '</a>';
					}
					addRaftTableData("Leader", leaderLabel, leaderURI);
				}

				addRaftSeparator();

				// Peers with health status
				var peers = health.Details.RaftPeers || [];
				var healthyMembers = health.Details.RaftHealthyMembers || [];
				if (peers.length > 0) {
					peers.forEach(function(peer) {
						var peerLabel = '<code>' + peer + '</code>';
						// Check if this peer matches the advertise address (with or without port)
						if (peer == health.Details.RaftBind || peer == health.Details.RaftAdvertise ||
								peer.replace(/:[0-9]+$/, '') == health.Details.RaftAdvertise) {
							peerLabel += ' <span class="text-primary">[This node]</span>';
						}
						if (peer == health.Details.RaftLeader) {
							peerLabel += ' <span class="text-success">[Leader]</span>';
						}
						// Check health - match peer against healthy members (strip port for comparison)
						var peerHost = peer.replace(/:[0-9]+$/, '');
						var isHealthy = healthyMembers.some(function(m) { return m == peerHost || m == peer; });
						var healthLabel = isHealthy ?
							'<span class="text-success">healthy</span>' :
							'<span class="text-muted">-</span>';
						addRaftTableData("Peer", peerLabel, healthLabel);
					});
				}

				if (stats) {
					addRaftSeparator();

					addRaftTableData("Term", '', '<code>' + (stats["term"] || "n/a") + '</code>');
					addRaftTableData("Commit index", '', '<code>' + (stats["commit_index"] || "n/a") + '</code>');
					addRaftTableData("Applied index", '', '<code>' + (stats["applied_index"] || "n/a") + '</code>');
					addRaftTableData("Last log index", '', '<code>' + (stats["last_log_index"] || "n/a") + '</code>');
					addRaftTableData("FSM pending", '', '<code>' + (stats["fsm_pending"] || "0") + '</code>');

					if (stats["last_contact"]) {
						addRaftTableData("Last contact", '', '<code>' + stats["last_contact"] + '</code>');
					}

					addRaftSeparator();

					addRaftTableData("Last snapshot index", '', '<code>' + (stats["last_snapshot_index"] || "n/a") + '</code>');
					addRaftTableData("Last snapshot term", '', '<code>' + (stats["last_snapshot_term"] || "n/a") + '</code>');
					addRaftTableData("Protocol version", '', '<code>' + (stats["protocol_version"] || "n/a") + '</code>');
				}
			}

    	if (isAuthorizedForAction()) {
    		addStatusActionButton("Reload configuration", "reload-configuration");
    		addStatusActionButton("Reset hostname resolve cache", "reset-hostname-resolve-cache");
    		addStatusActionButton("Reelect", "reelect");
    	}

    }, "json");
});
