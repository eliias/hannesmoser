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
        }
      }
    }

    stage("Build & Deploy") {
      when {
        branch 'master'
      }

      steps {
        sh label: 'container', script: ''' #!/usr/bin/env bash
        sudo docker build -t hannesmoser:$BUILD_NUMBER -t hannesmoser:latest .

        sudo docker tag hannesmoser:$BUILD_NUMBER registry.conc.at/hannesmoser:$BUILD_NUMBER
        sudo docker tag hannesmoser:latest registry.conc.at/hannesmoser:latest

        sudo docker push registry.conc.at/hannesmoser:$BUILD_NUMBER
        sudo docker push registry.conc.at/hannesmoser:latest
        '''

        sh label: 'deploy', script: ''' #!/usr/bin/env bash
        ssh dokku@projects.conc.at "git:from-image hannesmoser registry.conc.at/hannesmoser:$BUILD_NUMBER"
        '''
      }
    }
  }
}
