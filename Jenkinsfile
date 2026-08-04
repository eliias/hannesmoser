pipeline {
  agent any

  options {
    disableConcurrentBuilds()
  }

  stages {
    stage("Environment") {
      steps {
        script {
          env.BUILD_TAG = env.BRANCH_NAME.toString().hashCode()
          env.SITE_CHANGED = siteChanged().toString()
          echo "site changed: ${env.SITE_CHANGED}"
        }
      }
    }

    stage("Build & Deploy") {
      when {
        allOf {
          branch 'main'
          expression { env.SITE_CHANGED == "true" }
        }
      }

      steps {
        sh label: 'container', script: ''' #!/usr/bin/env bash
        # build and tag release artifact
        sudo docker build \
          -t hannesmoser:$BUILD_NUMBER \
          -t hannesmoser:latest \
          -t registry.conc.at/hannesmoser:$BUILD_NUMBER \
          -t registry.conc.at/hannesmoser:latest \
          .

        sudo docker tag hannesmoser:$BUILD_NUMBER registry.conc.at/hannesmoser:$BUILD_NUMBER
        sudo docker tag hannesmoser:latest registry.conc.at/hannesmoser:latest

        sudo docker push registry.conc.at/hannesmoser:$BUILD_NUMBER
        sudo docker push registry.conc.at/hannesmoser:latest
        '''

        sh label: 'deploy', script: ''' #!/usr/bin/env bash
        # deploy
        ssh dokku@projects.conc.at "git:from-image hannesmoser registry.conc.at/hannesmoser:$BUILD_NUMBER"
        '''
      }
    }
  }
}

// Every path touched by every commit in this build.
// Empty when Jenkins cannot tell: first build of a branch, manual run, replay.
def changedPaths() {
  return currentBuild.changeSets.collectMany { set ->
    set.items.collectMany { commit -> commit.affectedPaths }
  }
}

// A new apps/<name>/ needs its own Jenkinsfile and its own job. Nothing here deploys it.
// Deploy the site when anything outside apps/ changed, or when we cannot tell.
def siteChanged() {
  def paths = changedPaths()
  return paths.isEmpty() || paths.any { !it.startsWith("apps/") }
}
