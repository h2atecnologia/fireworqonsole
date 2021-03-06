import * as React from 'react'
import { Link } from 'react-router-dom'
import { pathQueueEdit } from '../path'
import { QueueValue } from './module'
import { ActionDispatcher } from './Container'
import Stats from '../stats/Container'
import Node from '../node/Container'
import AutoReload from '../auto-reload/Container'

interface Props {
  queueName?: string
  editing: boolean
  value: QueueValue
  actions: ActionDispatcher
}

export class Queue extends React.Component<Props, {}> {
  componentDidMount() {
    const queueName = this.props.queueName;
    if (queueName === undefined) return;
    if (this.props.value.queue !== undefined) return;

    this.props.actions.asyncGetQueue(queueName);
  }

  render() {
    const queueName = this.props.queueName;
    if (queueName === undefined)
      return null;

    let queue = this.props.value.queue;
    const noQueue = queue === undefined && !this.props.editing;
    if (queue === undefined) {
      queue = {
        name: queueName,
        pollingInterval: 0,
        maxWorkers: 0
      };
    }

    const pollingIntervalValue =
      queue.pollingInterval ? queue.pollingInterval + '' : '';
    const maxWorkersValue =
      queue.maxWorkers ? queue.maxWorkers + '' : '';

    const deleteQueue = (e: React.SyntheticEvent<any>) => {
      if (confirm("Are you sure you want to delete queue '" + queueName + "'?\n\nNote that all routings related to the queue are also deleted."))
        this.props.actions.asyncDeleteQueue(queueName);
      e.stopPropagation();
      e.preventDefault();
    };

    let queueInfo = noQueue ? <div className="queue none">(no queue)</div> : (
      <div key={'queue-' + queueName}>
        <dl className="queue">
          <dt>Node</dt>
          <dd><Node queueName={queueName} /></dd>

          <dt>Polling interval</dt>
          <dd className="config-value"><Link to={pathQueueEdit(queueName)}>
            {this.props.editing ? (
               <input name="polling-interval" defaultValue={pollingIntervalValue} placeholder="200" />
            ) : queue.pollingInterval}
            {typeof queue.pollingInterval === 'number' ? <span className="unit">ms</span> : null}
          </Link></dd>

          <dt>Max workers</dt>
          <dd className="config-value"><Link to={pathQueueEdit(queueName)}>
            {this.props.editing ? (
               <input name="max-workers" defaultValue={maxWorkersValue} placeholder="20" />
            ) : queue.maxWorkers}
          </Link></dd>

          <dt>Stats</dt>
          <dd className="stats chart"><Stats queueName={queueName} autoReload={true} /></dd>
        </dl>
        {this.props.editing ? null : (
           <div className="actions">
             <Link className="edit" to={pathQueueEdit(queueName)} />
             <Link className="delete" to="." onClick={deleteQueue} />
           </div>
        )}
      </div>
    );

    if (this.props.value.loadingCount !== 0) {
      queueInfo = <div className="loader ball-clip-rotate"><div /></div>;
    }

    let submitButton = <button type="submit">Save</button>;
    if (this.props.value.savingCount !== 0) {
      submitButton = <div className="loader ball-clip-rotate"><div /></div>;
    }

    return (
      <div>
        <AutoReload />
        <h2>Queue: {queueName}</h2>
        {this.props.editing ? (
           <form className="queue-edit" action="#" onSubmit={(e) => {
               e.stopPropagation();
               e.preventDefault();
               if (this.props.value.savingCount !== 0) return;

               const formData = new FormData(e.target as HTMLFormElement);
               this.props.actions.asyncPutQueue(queueName, {
                 polling_interval: parseInt(formData.get('polling-interval') as string || '', 10),
                 max_workers: parseInt(formData.get('max-workers') as string || '', 10)
               });
           }}>
             {queueInfo}
             {submitButton}
           </form>
        ) : queueInfo}

      </div>
    );
  }
}
